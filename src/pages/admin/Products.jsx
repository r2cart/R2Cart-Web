function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('r2cart-admin-user')) || null;
  } catch {
    return null;
  }
}
import { hasPermission } from '../../utils/permissions';
import {useEffect,useState} from 'react';
import {Link,useLocation,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {ArrowLeft,Star,Upload,Check,Clock3,Copy,Crop,Edit2,Eye,ImagePlus,LayoutGrid,Package,Plus,Search,Sparkles,Table as TableIcon,Trash2,ChevronLeft,ChevronRight,GripVertical,FileSpreadsheet} from 'lucide-react';
import {Button,ConfirmDialog,Modal,Pagination,StatusBadge,money} from '../../components/ui';
import {isProductComingSoon} from '../../config/homeLayout';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import ProductVariants from '../../components/admin/ProductVariants';
import NewProductPacks from '../../components/admin/NewProductPacks';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import UnitSelector from '../../components/admin/UnitSelector';
import useAdminCategories from '../../hooks/useAdminCategories';
import { generateProductDescription } from '../../utils/productDescriptionGenerator';
import { translateToHindi, getCachedHindi } from '../../utils/translator';
import ProductSpecificationsEditor from '../../components/admin/ProductSpecificationsEditor';
import { parseProductDetails, formatProductDetails } from '../../utils/productDetails';
import { compressImage } from '../../utils/imageCompressor';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const emptyProduct={name:'',nameHi:'',category:'',unit:'',mrp:'',price:'',costPrice:'',stock:'',lowStockThreshold:'',sku:'',description:'',image:'',status:'ACTIVE',featured:false,bestSeller:false,deliveryScope:'LOCAL',deliveryLocations:[],shippingFee:'',orderMode:'DIRECT_ORDER'};
const payload=product=>({
  name:product.name,
  category:product.category,
  unit:product.unit,
  mrp:Number(product.mrp),
  price:Number(product.price),
  costPrice:product.costPrice!==''&&product.costPrice!==undefined&&product.costPrice!==null?Number(product.costPrice):0,
  stock:Number(product.stock),
  ...(product.lowStockThreshold!==''&&{lowStockThreshold:Number(product.lowStockThreshold)}),
  description:product.description,
  image:product.image||'',
  status:product.status==='Active'?'ACTIVE':product.status,
  featured:Boolean(product.featured),
  bestSeller:Boolean(product.bestSeller),
  deliveryScope:product.deliveryScope||'LOCAL',
  deliveryLocations:Array.isArray(product.deliveryLocations)?product.deliveryLocations:(product.deliveryLocations?String(product.deliveryLocations).split(',').map(s=>s.trim()).filter(Boolean):[]),
  shippingFee:product.shippingFee?Number(product.shippingFee):0,
  orderMode:product.orderMode||'DIRECT_ORDER'
});


let adminProductsCache = null;
const adminCategoryCache = new Map();

const updateGlobalCaches = (productId, updater) => {
  if (adminProductsCache?.list) {
    adminProductsCache.list = adminProductsCache.list.map(p => p.id === productId ? updater(p) : p);
  }
  for (const [key, val] of adminCategoryCache.entries()) {
    if (val?.products) {
      val.products = val.products.map(p => p.id === productId ? updater(p) : p);
    }
  }
};

const removeGlobalCaches = (productId, packCount = 1) => {
  if (adminProductsCache?.list) {
    adminProductsCache.list = adminProductsCache.list.filter(p => p.id !== productId);
    adminProductsCache.totalProducts = Math.max(0, (adminProductsCache.totalProducts || 0) - packCount);
  }
  for (const [key, val] of adminCategoryCache.entries()) {
    if (val?.products) {
      val.products = val.products.filter(p => p.id !== productId);
      val.totalProducts = Math.max(0, (val.totalProducts || 0) - packCount);
    }
  }
};

export function AdminProducts(){
 const {notify,refreshProducts,storeSettings,setStoreSettings}=useApp();
 const currentUser = getAdminUser();
 const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN';
 const basePath = isSuper ? '/super-admin' : '/admin';
 const canCreate = isSuper || hasPermission(currentUser, 'products.create');
 const canEdit = isSuper || hasPermission(currentUser, 'products.edit');
 const canDelete = isSuper || hasPermission(currentUser, 'products.edit');
 const comingSoonProds = storeSettings?.policies?.homeLayout?.comingSoonProducts || [];
 const comingSoonCats = storeSettings?.policies?.homeLayout?.comingSoonCategories || [];
 const [localSoonMap, setLocalSoonMap] = useState({});

 const checkIsSoon = (prod) => {
   if (!prod) return false;
   if (localSoonMap[prod.id] !== undefined) return localSoonMap[prod.id];
   return isProductComingSoon(prod, storeSettings);
 };
 const {categories,categoryError,reloadCategories}=useAdminCategories();
 const [searchParams, setSearchParams] = useSearchParams();
 const urlCat = searchParams.get('cat') || searchParams.get('category') || 'all';
 const [viewMode, setViewMode] = useState(searchParams.get('view') === 'cards' ? 'cards' : 'table');
 const [q,setQ]=useState('');
 const [cat,setCat]=useState(urlCat);
 const [stock,setStock]=useState('all');
 const [status,setStatus]=useState('all');
 const [list,setList]=useState(adminProductsCache?.list || []);
 const [loading,setLoading]=useState(!adminProductsCache);
 const [manageOpen,setManageOpen]=useState(false);
 const [confirm,setConfirm]=useState(null);
 const [deleteAllConfirm,setDeleteAllConfirm]=useState(false);
 const [deleteCatConfirm,setDeleteCatConfirm]=useState(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(''),[view,setView]=useState(null);
 const [page,setPage]=useState(1),[pagination,setPagination]=useState(adminProductsCache?.pagination || {pages:1,total:0}),[totalProducts,setTotalProducts]=useState(adminProductsCache?.totalProducts || 0),[refresh,setRefresh]=useState(0);

 const changeCategory = (newCat) => {
   setCat(newCat);
   setPage(1);
   const key = `${newCat}__${stock}__${status}__1__${q.trim().toLowerCase()}`;
   if (adminCategoryCache.has(key)) {
     const cached = adminCategoryCache.get(key);
     setList(cached.products);
     setPagination(cached.pagination);
     setTotalProducts(cached.totalProducts);
     setLoading(false);
   } else {
     setLoading(true);
   }
 };

 const changeFilter = setter => value => {
   setter(value);
   setPage(1);
   const nextCat = setter === setCat ? value : cat;
   const nextStock = setter === setStock ? value : stock;
   const nextStatus = setter === setStatus ? value : status;
   const nextQ = setter === setQ ? value : q;
   const key = `${nextCat}__${nextStock}__${nextStatus}__1__${nextQ.trim().toLowerCase()}`;
   if (adminCategoryCache.has(key)) {
     const cached = adminCategoryCache.get(key);
     setList(cached.products);
     setPagination(cached.pagination);
     setTotalProducts(cached.totalProducts);
     setLoading(false);
   } else {
     setLoading(true);
   }
 };

 useEffect(() => {
   const c = searchParams.get('cat') || searchParams.get('category');
   if (c && c !== cat) {
     changeCategory(c);
   }
   const v = searchParams.get('view');
   if (v && (v === 'cards' || v === 'table')) {
     setViewMode(v);
   }
 }, [searchParams]);

 useEffect(()=>{
   let active=true;
   const cacheKey = `${cat}__${stock}__${status}__${page}__${q.trim().toLowerCase()}`;
   if (adminCategoryCache.has(cacheKey)) {
     const cached = adminCategoryCache.get(cacheKey);
     setList(cached.products);
     setPagination(cached.pagination);
     setTotalProducts(cached.totalProducts);
     setLoading(false);
   } else {
     setLoading(true);
   }

   const delay = q ? 200 : 0;
   const timer=setTimeout(()=>{
     adminService.productsPage({page,limit:20,q,...(cat!=='all'&&{category:cat}),...(stock!=='all'&&{stock}),...(status!=='all'&&{status})})
       .then(result=>{
         if(!active)return;
         adminCategoryCache.set(cacheKey, result);
         adminProductsCache={list:result.products,pagination:result.pagination,totalProducts:result.totalProducts};
         setList(result.products);
         setPagination(result.pagination);
         setTotalProducts(result.totalProducts);
         setError('');
       })
       .catch(reason=>{if(active){if (!adminCategoryCache.has(cacheKey)) setList([]);setError(reason.message)}})
       .finally(()=>{if(active)setLoading(false)});
   }, delay);
   return()=>{active=false;clearTimeout(timer)};
 },[page,q,cat,stock,status,refresh]);

 useEffect(()=>{
   const onSync=e=>{
     if(e?.detail?.source==='admin-local-delete'||e?.detail?.source==='admin-local-action')return;
     adminProductsCache=null;
     adminCategoryCache.clear();
     setRefresh(v=>v+1);
   };
   window.addEventListener('r2cart:orders-updated',onSync);
   window.addEventListener('r2cart:products-updated',onSync);
   return()=>{
     window.removeEventListener('r2cart:orders-updated',onSync);
     window.removeEventListener('r2cart:products-updated',onSync);
   };
 },[]);

 const toggle=async product=>{
  const prevStatus=product.status;
  const next=prevStatus==='ACTIVE'?'INACTIVE':'ACTIVE';
  setList(prev=>prev.map(p=>p.id===product.id?{...p,status:next}:p));
  updateGlobalCaches(product.id, p=>({...p,status:next}));
  try{
    await adminService.updateProductStatus(product.id,next);
    notify(`"${product.name}" is now ${next==='ACTIVE'?'visible in store':'hidden from store'}`,'success');
    window.dispatchEvent(new CustomEvent('r2cart:products-updated',{detail:{source:'admin-local-action',id:product.id}}));
  }catch(reason){
    notify(reason.message||'Failed to update status','error');
    setList(prev=>prev.map(p=>p.id===product.id?{...p,status:prevStatus}:p));
    updateGlobalCaches(product.id, p=>({...p,status:prevStatus}));
  }
 };

 const toggleStock=async (product, targetStock)=>{
  const prevStock=product.stock;
  const newStock=Number(targetStock);
  setList(prev=>prev.map(p=>p.id===product.id?{...p,stock:newStock}:p));
  updateGlobalCaches(product.id, p=>({...p,stock:newStock}));
  try{
    await adminService.updateProductStock(product.id,newStock);
    notify(newStock<=0?`"${product.name}" marked as Sold Out (Unavailable)`:`"${product.name}" marked In Stock (${newStock} units)`,'success');
    window.dispatchEvent(new CustomEvent('r2cart:products-updated',{detail:{source:'admin-local-action',id:product.id}}));
  }catch(reason){
    notify(reason.message||'Failed to update stock','error');
    setList(prev=>prev.map(p=>p.id===product.id?{...p,stock:prevStock}:p));
    updateGlobalCaches(product.id, p=>({...p,stock:prevStock}));
  }
 };
 const toggleComingSoon=async (product)=>{
  const currentSoon=checkIsSoon(product);
  const nextSoon=!currentSoon;

  // Optimistic UI update in 0ms:
  const packIds=[product.id, ...(product.packs||[]).map(p=>p.id)];
  const newMap={...localSoonMap};
  packIds.forEach(id=>{ newMap[id]=nextSoon; });
  setLocalSoonMap(newMap);
  setList(prev=>prev.map(p=>p.id===product.id?{...p,isSoon:nextSoon}:p));
  setBusy(`soon-${product.id}`);

  try{
    const res=await adminService.toggleProductComingSoon(product.id, nextSoon);
    notify(`"${product.name}" is now marked as ${res.isSoon ? 'Coming Soon' : 'Available'}`,'success');
    if (res.policies && setStoreSettings) {
      setStoreSettings(prev => ({ ...prev, policies: res.policies }));
    }
    window.dispatchEvent(new CustomEvent('r2cart:settings-updated', { detail: { policies: res.policies, settings: res.policies } }));
    window.dispatchEvent(new Event('r2cart:products-updated'));
  }catch(err){
    notify(err.message||'Failed to update Coming Soon status','error');
    const reverted={...localSoonMap};
    packIds.forEach(id=>{ reverted[id]=currentSoon; });
    setLocalSoonMap(reverted);
    setList(prev=>prev.map(p=>p.id===product.id?{...p,isSoon:currentSoon}:p));
  }finally{
    setBusy('');
  }
 };
 const destroy=async()=>{
  const product=confirm;
  if(!product)return;
  const toRemoveId=product.id;
  const removedName=product.name;
  const removedPacks=product.packCount||1;

  // 1. Instant close dialog and optimistic UI removal (0ms latency, zero page reload)
  setConfirm(null);
  const prevList=list;
  const prevPagination=pagination;
  const prevTotal=totalProducts;

  setList(prev=>prev.filter(p=>p.id!==toRemoveId));
  setPagination(prev=>({
    ...prev,
    total:Math.max(0,prev.total-1),
    pages:Math.max(1,Math.ceil(Math.max(0,prev.total-1)/20))
  }));
  setTotalProducts(prev=>Math.max(0,prev-removedPacks));

  removeGlobalCaches(toRemoveId, removedPacks);

  // 2. Background DB soft-delete with non-blocking Cloudinary cleanup
  try{
    await adminService.deleteProduct(toRemoveId);
    notify(`"${removedName}" deleted successfully`,'success');
    window.dispatchEvent(new CustomEvent('r2cart:products-updated',{detail:{source:'admin-local-delete',id:toRemoveId}}));
  }catch(reason){
    notify(reason.message||'Failed to delete product','error');
    setList(prevList);
    setPagination(prevPagination);
    setTotalProducts(prevTotal);
    adminProductsCache=null;
    adminCategoryCache.clear();
  }
 };
 const destroyAll=async()=>{
  setDeleteAllConfirm(false);
  const prevList=list;
  const prevPagination=pagination;
  const prevTotal=totalProducts;

  setList([]);
  setPagination({pages:1,total:0});
  setTotalProducts(0);
  adminProductsCache=null;
  adminCategoryCache.clear();

  try{
    const res=await adminService.deleteAllProducts();
    notify(res?.message||'All products deleted successfully','success');
    window.dispatchEvent(new CustomEvent('r2cart:products-updated',{detail:{source:'admin-local-delete'}}));
  }catch(reason){
    notify(reason.message||'Failed to delete all products','error');
    setList(prevList);
    setPagination(prevPagination);
    setTotalProducts(prevTotal);
  }
 };

 const destroyCategoryProducts=async()=>{
  const target=deleteCatConfirm;
  if(!target)return;
  const targetSlug=target.slug||target.id;
  const targetId=target.id;
  const targetName=target.name;

  setDeleteCatConfirm(null);
  const prevList=list;
  const prevPagination=pagination;
  const prevTotal=totalProducts;

  const isMatch=p=>(p.categorySlug===targetSlug||p.category===targetSlug||p.categoryId===targetId);
  const removedCount=list.filter(isMatch).length;

  setList(prev=>prev.filter(p=>!isMatch(p)));
  setPagination(prev=>({
    ...prev,
    total:Math.max(0,prev.total-removedCount),
    pages:Math.max(1,Math.ceil(Math.max(0,prev.total-removedCount)/20))
  }));
  setTotalProducts(prev=>Math.max(0,prev-removedCount));

  if(adminProductsCache){
    adminProductsCache.list=(adminProductsCache.list||[]).filter(p=>!isMatch(p));
    adminProductsCache.totalProducts=Math.max(0,(adminProductsCache.totalProducts||0)-removedCount);
    if(adminProductsCache.pagination){
      adminProductsCache.pagination.total=Math.max(0,adminProductsCache.pagination.total-removedCount);
      adminProductsCache.pagination.pages=Math.max(1,Math.ceil(adminProductsCache.pagination.total/20));
    }
  }
  adminCategoryCache.clear();

  try{
    const res=await adminService.deleteProductsByCategory(targetSlug);
    notify(res?.message||`All products in "${targetName}" deleted successfully`,'success');
    window.dispatchEvent(new CustomEvent('r2cart:products-updated',{detail:{source:'admin-local-delete'}}));
  }catch(err){
    notify(err.message||'Failed to delete category products','error');
    setList(prevList);
    setPagination(prevPagination);
    setTotalProducts(prevTotal);
    adminProductsCache=null;
  }
 };
 const inspect=async id=>{setBusy(id);try{setView(await adminService.product(id))}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};

 return <>
  <AdminTitle title="Products" text={loading?'Loading catalogue…':error?'Catalogue unavailable':`${pagination.total} Products · ${totalProducts} Total Packs across store`} action={
    <div className="bulk-upload-actions" style={{display:'flex',alignItems:'center',gap:'8px',position:'relative'}}>
      {(isSuper && totalProducts > 0 || (cat !== 'all' && pagination.total > 0)) && (
        <div style={{position:'relative'}}>
          <Button
            type="button"
            variant="outline"
            onClick={()=>setManageOpen(v=>!v)}
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:'6px',
              borderColor:'#fca5a5',
              color:'#dc2626',
              background:'#fef2f2',
              fontWeight:700,
              fontSize:'12.5px'
            }}
            title="Manage & cleanup catalogue"
          >
            <Trash2 size={14} color="#dc2626" />
            <span>Manage ▾</span>
          </Button>

          {manageOpen && (
            <>
              <div
                style={{position:'fixed',inset:0,zIndex:998}}
                onClick={()=>setManageOpen(false)}
              />
              <div
                style={{
                  position:'absolute',
                  right:0,
                  top:'calc(100% + 6px)',
                  background:'#ffffff',
                  borderRadius:'12px',
                  border:'1px solid #fecaca',
                  boxShadow:'0 10px 25px -5px rgba(220, 38, 38, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding:'6px',
                  minWidth:'230px',
                  zIndex:999,
                  display:'flex',
                  flexDirection:'column',
                  gap:'4px'
                }}
              >
                {cat !== 'all' && pagination.total > 0 && (
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={()=>{
                      setManageOpen(false);
                      const cObj = categories.find(c => c.slug === cat) || { slug: cat, name: cat };
                      setDeleteCatConfirm(cObj);
                    }}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      gap:'8px',
                      width:'100%',
                      padding:'9px 12px',
                      border:'none',
                      borderRadius:'8px',
                      background:'transparent',
                      color:'#dc2626',
                      fontSize:'12.5px',
                      fontWeight:600,
                      cursor:'pointer',
                      textAlign:'left'
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <Trash2 size={14} />
                    <span>Delete All in Category ({pagination.total})</span>
                  </button>
                )}

                {isSuper && totalProducts > 0 && (
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={()=>{
                      setManageOpen(false);
                      setDeleteAllConfirm(true);
                    }}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      gap:'8px',
                      width:'100%',
                      padding:'9px 12px',
                      border:'none',
                      borderRadius:'8px',
                      background:'transparent',
                      color:'#dc2626',
                      fontSize:'12.5px',
                      fontWeight:600,
                      cursor:'pointer',
                      textAlign:'left'
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <Trash2 size={14} />
                    <span>Delete All Products ({totalProducts})</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {canCreate && (
        <Link className="btn btn-outline" to={`${basePath}/products/import`} style={{display:'inline-flex',alignItems:'center',gap:'6px',borderColor:'#10b981',color:'#047857',fontWeight:700}}>
          <FileSpreadsheet size={16} /> Excel Bulk Edit & Pricing
        </Link>
      )}

      {canCreate && (
        <Link className="btn btn-primary" to={`${basePath}/products/new`} style={{display:'inline-flex',alignItems:'center',gap:'6px'}}>
          <Plus size={16} /> Add product
        </Link>
      )}
    </div>
  }/>
  {categoryError&&<div className="admin-card bulk-error">{categoryError}<Button variant="outline" onClick={reloadCategories}>Retry categories</Button></div>}
  <FilterBar q={q} setQ={changeFilter(setQ)}>
   <select value={cat} onChange={event=>changeCategory(event.target.value)}><option value="all">All categories</option>{categories.map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select>
   <select value={stock} onChange={event=>changeFilter(setStock)(event.target.value)}><option value="all">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
   <select value={status} onChange={event=>changeFilter(setStatus)(event.target.value)}><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
   <div className="view-mode-toggle" style={{display:'flex',gap:'4px',marginLeft:'auto',alignItems:'center'}}>
     <button type="button" className={`btn ${viewMode==='table'?'btn-primary':'btn-outline'}`} style={{height:'36px',padding:'0 10px',display:'flex',alignItems:'center',gap:'5px',fontSize:'12px'}} onClick={()=>setViewMode('table')} title="Table View"><TableIcon size={15}/> Table</button>
     <button type="button" className={`btn ${viewMode==='cards'?'btn-primary':'btn-outline'}`} style={{height:'36px',padding:'0 10px',display:'flex',alignItems:'center',gap:'5px',fontSize:'12px'}} onClick={()=>setViewMode('cards')} title="Card Shape View"><LayoutGrid size={15}/> Cards</button>
   </div>
  </FilterBar>
  {viewMode === 'cards' ? (
   <div className="cat-products-card-grid" style={{marginBottom:'24px'}}>
     {loading ? (
        Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="product-card-shape product-card-skeleton" style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
            <div className="card-shape-media r2c-skeleton-box" style={{ height: '145px', borderBottom: '1px solid #f1f5f9' }} />
            <div className="card-shape-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="r2c-skeleton-box" style={{ height: '10px', width: '45%', borderRadius: '4px' }} />
              <div className="r2c-skeleton-box" style={{ height: '14px', width: '90%', borderRadius: '4px' }} />
              <div className="r2c-skeleton-box" style={{ height: '14px', width: '60%', borderRadius: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div className="r2c-skeleton-box" style={{ height: '18px', width: '38%', borderRadius: '4px' }} />
                <div className="r2c-skeleton-box" style={{ height: '20px', width: '28%', borderRadius: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
                <div className="r2c-skeleton-box" style={{ height: '28px', flex: 1, borderRadius: '6px' }} />
                <div className="r2c-skeleton-box" style={{ height: '28px', width: '28px', borderRadius: '6px' }} />
                <div className="r2c-skeleton-box" style={{ height: '28px', width: '28px', borderRadius: '6px' }} />
                <div className="r2c-skeleton-box" style={{ height: '28px', width: '28px', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        ))
     ) : error ? (
       <div style={{gridColumn:'1/-1',padding:'30px',textAlign:'center'}}><p role="alert">{error}</p><Button variant="outline" onClick={()=>setRefresh(v=>v+1)}>Try again</Button></div>
     ) : !list.length ? (
       <div style={{gridColumn:'1/-1',padding:'40px',textAlign:'center',color:'var(--muted)'}}>{totalProducts ? 'No products match these filters.' : 'No products yet. Add your first product.'}</div>
     ) : (
       list.map(product => {
         const isOutOfStock = product.stock <= 0;
         const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);
         const hasDiscount = Number(product.mrp) > Number(product.price);
         const discountPct = hasDiscount ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) : 0;
         const isProductSoon = checkIsSoon(product);
         return (
           <div key={product.id} className="product-card-shape">
             <div className="card-shape-media">
               {isProductSoon && (
                 <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#d97706', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                   <Clock3 size={10} /> SOON
                 </span>
               )}
               {product.image ? (
                 <img src={product.image} alt={product.name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
               ) : (
                 <Package size={44} color="#94a3b8" />
               )}
               {hasDiscount && <span className="card-discount-pill">{discountPct}% OFF</span>}
               <span 
                 className={`card-stock-pill ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}`}
                 style={{cursor:'pointer'}}
                 onClick={(e)=>{e.stopPropagation(); toggleStock(product, isOutOfStock ? 20 : 0);}}
                 title={isOutOfStock ? "Click to Mark In Stock (+20)" : "Click to Mark Sold Out (0)"}
               >
                 {isOutOfStock ? '0 Sold Out' : isLowStock ? `${product.stock} Low` : `${product.stock} in stock`}
               </span>
               <span className={`card-status-pill ${product.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                 {product.status === 'ACTIVE' ? '● Active' : '○ Inactive'}
               </span>
             </div>
             <div className="card-shape-content">
               <div className="card-meta-row">
                 <span className="card-sku-code" title={product.sku}>{product.sku || 'No SKU'}</span>
                 <span className="card-unit-badge">{product.unit || 'Pack'}</span>
               </div>
               <h4 className="card-product-title" title={product.name}>{product.name}</h4>
               <div className="card-price-row">
                  <div className="card-price-left">
                    <strong className="card-selling-price">{money(product.price)}</strong>
                    {hasDiscount && <del className="card-mrp-price">{money(product.mrp)}</del>}
                  </div>
                  <button 
                    type="button" 
                    disabled={!!busy} 
                    className={`card-quick-stock-btn ${isOutOfStock ? 'is-out' : 'is-in'}`}
                    onClick={() => toggleStock(product, isOutOfStock ? 20 : 0)} 
                    title={isOutOfStock ? "Click to Restock (+20)" : "Click to mark Sold Out (0)"}
                  >
                    {isOutOfStock ? '+ Restock' : 'Sold Out'}
                  </button>
                </div>
                <div className="card-action-bar">
                  <button
                    type="button"
                    disabled={!!busy}
                    className={`card-status-toggle-btn ${product.status === 'ACTIVE' ? 'active' : 'inactive'}`}
                    onClick={() => toggle(product)}
                    title="Click to toggle Active / Inactive"
                  >
                    <span className="dot" /> {product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    disabled={busy === `soon-${product.id}`}
                    onClick={() => toggleComingSoon(product)}
                    style={{
                      fontSize: '10.5px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isProductSoon ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                      background: isProductSoon ? '#fef3c7' : '#ffffff',
                      color: isProductSoon ? '#b45309' : '#64748b',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={isProductSoon ? "Marked as Coming Soon (Click to make Available)" : "Marked as Available (Click to mark Coming Soon)"}
                  >
                    <Clock3 size={11} />
                    {isProductSoon ? 'Soon: ON' : 'Soon: OFF'}
                  </button>
                  <div className="card-action-icons">
                    <button type="button" className="r2c-action-btn r2c-btn-view" onClick={() => inspect(product.id)} title="View details"><Eye size={14}/></button>
                    <Link to={`${basePath}/products/${product.id}/edit`} state={{ product }} className="r2c-action-btn r2c-btn-edit" title="Edit product"><Edit2 size={14}/></Link>
                    <button type="button" disabled={!!busy} className="r2c-action-btn r2c-btn-delete" onClick={() => setConfirm(product)} title="Delete product"><Trash2 size={14}/></button>
                  </div>
                </div>
             </div>
           </div>
         );
       })
     )}
   </div>
  ) : (
   <div className="admin-card table-card"><div className="table-wrap"><table><thead><tr><th style={{width:'32%',minWidth:'250px'}}>Product</th><th style={{width:'14%',minWidth:'125px'}}>Category</th><th style={{width:'11%',minWidth:'105px'}}>Unit</th><th style={{width:'8%',minWidth:'70px'}}>MRP</th><th style={{width:'9%',minWidth:'85px'}}>Selling price</th><th style={{width:'13%',minWidth:'135px'}}>Stock status</th><th style={{width:'8%',minWidth:'80px'}}>Soon</th><th style={{width:'8%',minWidth:'85px'}}>Status</th><th style={{width:'9%',minWidth:'90px'}}>Actions</th></tr></thead><tbody>
    {loading ? (
      Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="skeleton-table-row">
          <td>
            <div className="product-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="r2c-skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '8px', flexShrink: 0 }} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="r2c-skeleton-box" style={{ height: '14px', width: '75%', borderRadius: '4px' }} />
                <div className="r2c-skeleton-box" style={{ height: '10px', width: '40%', borderRadius: '4px' }} />
              </div>
            </div>
          </td>
          <td><div className="r2c-skeleton-box" style={{ height: '13px', width: '70px', borderRadius: '4px' }} /></td>
          <td><div className="r2c-skeleton-box" style={{ height: '13px', width: '55px', borderRadius: '4px' }} /></td>
          <td><div className="r2c-skeleton-box" style={{ height: '13px', width: '45px', borderRadius: '4px' }} /></td>
          <td><div className="r2c-skeleton-box" style={{ height: '14px', width: '50px', borderRadius: '4px' }} /></td>
          <td><div className="r2c-skeleton-box" style={{ height: '18px', width: '42px', borderRadius: '12px' }} /></td>
          <td><div className="r2c-skeleton-box" style={{ height: '20px', width: '55px', borderRadius: '12px' }} /></td>
          <td><div className="r2c-skeleton-box" style={{ height: '20px', width: '55px', borderRadius: '12px' }} /></td>
          <td>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div className="r2c-skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
              <div className="r2c-skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
              <div className="r2c-skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            </div>
          </td>
        </tr>
      ))
    ) : error?<tr><td colSpan="9"><p role="alert">{error}</p><Button variant="outline" onClick={()=>setRefresh(value=>value+1)}>Try again</Button></td></tr>:!list.length?<tr><td colSpan="9">{totalProducts?'No products match these filters.':'No products yet. Add your first product or use bulk import.'}</td></tr>:list.map(product=><tr key={product.id}><td style={{verticalAlign:'middle'}}><div className="product-cell">{product.image?<img src={product.image} alt={product.name || 'Product'} onError={e=>{e.currentTarget.style.display='none'}}/>:<div style={{width:'44px',height:'44px',borderRadius:'8px',background:'#f1f5f9',display:'grid',placeItems:'center',flexShrink:0,color:'#94a3b8'}}><Package size={20}/></div>}<span><div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}><b title={product.name}>{product.name}</b>{product.packCount>1&&<span style={{background:'#ecfdf5',color:'#047857',border:'1px solid #a7f3d0',borderRadius:'12px',padding:'1px 7px',fontSize:'10.5px',fontWeight:800}}>📦 {product.packCount} Packs</span>}</div><small>{product.sku}</small></span></div></td><td className="product-table-cat-col" title={product.categoryName||product.category}><b>{product.categoryName||product.category}</b></td><td style={{whiteSpace:'nowrap'}}><b>{product.unit}</b>{product.packCount>1&&<small style={{display:'block',color:'#059669',fontSize:'11px',fontWeight:700,marginTop:'2px'}}>+{product.packCount-1} more size{product.packCount>2?'s':''}</small>}</td><td style={{whiteSpace:'nowrap'}}>{money(product.mrp)}</td><td style={{whiteSpace:'nowrap'}}><b>{money(product.price)}</b></td><td style={{whiteSpace:'nowrap',verticalAlign:'middle'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span className={product.stock<=0?'badge badge-red':product.stock<=product.lowStockThreshold?'badge badge-amber':''} style={{fontSize:'11px',fontWeight:700}}>{product.stock<=0?'0 Sold Out':`${product.stock} in stock`}</span>{product.stock>0?<button type="button" onClick={()=>toggleStock(product,0)} title="Click to Mark as Sold Out / Out of Stock" style={{fontSize:'10px',padding:'2px 7px',borderRadius:'6px',border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',cursor:'pointer',fontWeight:700}}>Sold Out</button>:<button type="button" onClick={()=>toggleStock(product,20)} title="Click to Restock / Mark In Stock (+20 units)" style={{fontSize:'10px',padding:'2px 7px',borderRadius:'6px',border:'1px solid #bbf7d0',background:'#f0fdf4',color:'#15803d',cursor:'pointer',fontWeight:700}}>+ In Stock</button>}</div></td><td style={{whiteSpace:'nowrap'}}><button type="button" disabled={busy===`soon-${product.id}`} onClick={()=>toggleComingSoon(product)} style={{fontSize:'10px',padding:'3px 8px',borderRadius:'6px',border:checkIsSoon(product)?'1.5px solid #fde68a':'1px solid #e2e8f0',background:checkIsSoon(product)?'#fef3c7':'#f8fafc',color:checkIsSoon(product)?'#b45309':'#64748b',cursor:'pointer',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'4px'}} title={checkIsSoon(product)?'Marked as Coming Soon (Click to make Available)':'Marked as Available (Click to mark Coming Soon)'}><Clock3 size={11}/>{checkIsSoon(product)?'Soon: ON':'Soon: OFF'}</button></td><td style={{whiteSpace:'nowrap'}}><button disabled={!!busy} onClick={()=>toggle(product)} aria-label="Toggle product status"><StatusBadge status={product.status==='ACTIVE'?'Active':'Inactive'}/></button></td><td style={{whiteSpace:'nowrap'}}><div className="table-actions"><button disabled={!!busy} aria-label="View product" onClick={()=>inspect(product.id)} className="r2c-table-btn r2c-btn-view" title="View product details"><Eye size={15}/></button><Link aria-label="Edit product" to={`${basePath}/products/${product.id}/edit`} state={{ product }} className="r2c-table-btn r2c-btn-edit" title="Edit product"><Edit2 size={15}/></Link><button disabled={!!busy} aria-label="Delete product" onClick={()=>setConfirm(product)} className="r2c-table-btn r2c-btn-delete" title="Delete product"><Trash2 size={15}/></button></div></td></tr>)}
   </tbody></table></div></div>
  )}
  {!loading&&!error&&pagination.pages>1&&<Pagination page={page} setPage={setPage} total={pagination.pages}/>}
  <ConfirmDialog
    open={!!confirm}
    onClose={() => { if (!busy) setConfirm(null); }}
    onConfirm={destroy}
    title="Delete Product?"
    itemName={confirm ? `${confirm.name}${confirm.unit ? ` · ${confirm.unit}` : ''}` : ''}
    itemType="Product"
    message={`Are you sure you want to permanently delete "${confirm?.name || 'this product'}"? This pack will be immediately removed from the customer catalog and stock inventory.`}
    warningNote="Existing customer order histories and transaction records will safely preserve this item."
    confirmText="Delete Product"
    cancelText="Cancel"
  />
  <ConfirmDialog
    open={Boolean(deleteCatConfirm)}
    onClose={() => { if (!busy) setDeleteCatConfirm(null); }}
    onConfirm={destroyCategoryProducts}
    title={`Delete All Products in ${deleteCatConfirm?.name || 'Category'}?`}
    itemType="Category Products"
    itemName={deleteCatConfirm?.name || ''}
    message={`Are you sure you want to delete ALL ${pagination.total} products in "${deleteCatConfirm?.name}"? All products in this category will be removed from your customer storefront.`}
    warningNote="This action cannot be undone. You will be able to add or import fresh real products for this category."
    confirmText={busy === 'cat-delete' ? 'Deleting category products…' : `Yes, Delete All ${pagination.total} Products`}
    cancelText="Cancel"
  />
  <ConfirmDialog
    open={deleteAllConfirm}
    onClose={() => { if (!busy) setDeleteAllConfirm(false); }}
    onConfirm={destroyAll}
    title="Delete All Products?"
    message={`Are you sure you want to delete all ${totalProducts} products from your store? This will completely clear your product catalog from the customer storefront.`}
    warningNote="This action is permanent and cannot be undone. All sellable packs will be deleted."
    confirmText={busy === 'all' ? 'Deleting all products…' : 'Yes, Delete All Products'}
    cancelText="Cancel"
  />
   <ProductDetailModal view={view} onClose={()=>setView(null)} basePath={basePath} />
  </>;
}

export function ProductDetailModal({ view, onClose, basePath = '/admin' }) {
  const { notify, storeSettings, setStoreSettings } = useApp();
  const [copied, setCopied] = useState(false);
  const [togglingSoon, setTogglingSoon] = useState(false);
  const [activeImage, setActiveImage] = useState(view?.image || view?.images?.[0] || '');
  const [modalSoon, setModalSoon] = useState(() => isProductComingSoon(view, storeSettings));

  useEffect(() => {
    if (view) {
      setModalSoon(isProductComingSoon(view, storeSettings));
    }
  }, [view, storeSettings]);

  const isSoon = modalSoon;

  const handleToggleSoon = async () => {
    if (!view?.id) return;
    const nextSoon = !isSoon;
    setModalSoon(nextSoon);
    setTogglingSoon(true);
    try {
      const res = await adminService.toggleProductComingSoon(view.id, nextSoon);
      notify(`"${view.name}" is now marked as ${res.isSoon ? 'Coming Soon' : 'Available'}`, 'success');
      if (res.policies && setStoreSettings) {
        setStoreSettings(prev => ({ ...prev, policies: res.policies }));
      }
      window.dispatchEvent(new CustomEvent('r2cart:settings-updated', { detail: { policies: res.policies, settings: res.policies } }));
      window.dispatchEvent(new Event('r2cart:products-updated'));
    } catch (err) {
      notify(err.message || 'Failed to update Coming Soon status', 'error');
      setModalSoon(isSoon);
    } finally {
      setTogglingSoon(false);
    }
  };

  useEffect(() => {
    if (view) {
      setActiveImage(view.image || view.images?.[0] || '');
    }
  }, [view]);

  if (!view) return null;

  const galleryImages = (view.images && view.images.length > 0)
    ? view.images
    : (view.image ? [view.image] : []);

  const copySku = () => {
    if (view.sku) {
      navigator.clipboard?.writeText(view.sku);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mrp = Number(view.mrp || 0);
  const price = Number(view.price || 0);
  const savings = mrp > price ? mrp - price : 0;
  const discount = mrp > 0 && savings > 0 ? Math.round((savings / mrp) * 100) : 0;

  return (
    <Modal open={!!view} onClose={onClose} title="Product Details">
      <div style={{ padding: '16px 20px 22px', boxSizing: 'border-box' }}>
        {/* Top Product Hero Card */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}
        >
          {activeImage ? (
            <div style={{display:'flex',flexDirection:'column',gap:'6px',flexShrink:0}}>
              <img
                src={activeImage}
                alt={view.name}
                style={{
                  width: '90px',
                  height: '90px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '4px'
                }}
              />
              {galleryImages.length > 1 && (
                <div style={{display:'flex',gap:'4px',maxWidth:'90px',overflowX:'auto',paddingBottom:'2px'}}>
                  {galleryImages.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(src)}
                      style={{
                        padding: 0,
                        border: activeImage === src ? '2px solid #059669' : '1px solid #e2e8f0',
                        borderRadius: '4px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        width: '22px',
                        height: '22px',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                    >
                      <img src={src} alt={`${view.name || 'Product'} thumbnail ${idx + 1}`} style={{width:'100%',height:'100%',objectFit:'contain'}} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'grid',
                placeItems: 'center',
                color: '#94a3b8',
                flexShrink: 0
              }}
            >
              <Package size={28} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: view.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                  color: view.status === 'ACTIVE' ? '#15803d' : '#64748b',
                  textTransform: 'uppercase'
                }}
              >
                {view.status}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '2px 7px',
                  borderRadius: '5px',
                  border: '1px solid #a7f3d0'
                }}
              >
                {view.categoryName || view.category}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: view.deliveryScope === 'PAN_INDIA' ? '#6d28d9' : (view.deliveryScope === 'CUSTOM' ? '#0369a1' : '#475569'),
                  background: view.deliveryScope === 'PAN_INDIA' ? '#ede9fe' : (view.deliveryScope === 'CUSTOM' ? '#e0f2fe' : '#f1f5f9'),
                  padding: '2px 7px',
                  borderRadius: '5px',
                  border: `1px solid ${view.deliveryScope === 'PAN_INDIA' ? '#ddd6fe' : (view.deliveryScope === 'CUSTOM' ? '#bae6fd' : '#e2e8f0')}`
                }}
              >
                {view.deliveryScope === 'PAN_INDIA' ? '🇮🇳 Pan-India' : (view.deliveryScope === 'CUSTOM' ? '📍 Specific Locations' : '🏘️ Local')}
              </span>

              {view.orderMode === 'CONTACT_REQUEST' && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#c2410c', background: '#fff7ed', padding: '2px 7px', borderRadius: '5px', border: '1px solid #fed7aa' }}>
                  📞 Enquiry Only
                </span>
              )}
              {view.orderMode === 'BOTH' && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', background: '#f0fdf4', padding: '2px 7px', borderRadius: '5px', border: '1px solid #bbf7d0' }}>
                  🔀 Order + Enquiry
                </span>
              )}

              {view.unit && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', background: '#ffffff', padding: '2px 7px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                  {view.unit}
                </span>
              )}

              {isSoon && (
                <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Clock3 size={11} /> SOON
                </span>
              )}
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
              {view.name}
            </h3>

            {/* Price Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <b style={{ fontSize: '17px', fontWeight: 800, color: '#059669' }}>
                {money(price)}
              </b>
              {mrp > price && (
                <del style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                  {money(mrp)}
                </del>
              )}
              {savings > 0 && (
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '2px 6px', borderRadius: '5px' }}>
                  Save {money(savings)} ({discount}% OFF)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        {view.description && (
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>
              Description
            </span>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '12.5px',
                color: '#334155',
                lineHeight: 1.5
              }}
            >
              {view.description}
            </div>
          </div>
        )}

        {/* Info Metrics Grid */}
        {view.packs && view.packs.length > 1 && (
          <div style={{ marginBottom: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              📦 All {view.packs.length} Available Pack Sizes & Variants
            </span>
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px' }}>
                    <th style={{ padding: '7px 10px' }}>Pack Size</th>
                    <th style={{ padding: '7px 10px' }}>Selling Price</th>
                    <th style={{ padding: '7px 10px' }}>MRP</th>
                    <th style={{ padding: '7px 10px' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {view.packs.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: idx < view.packs.length - 1 ? '1px solid #f1f5f9' : 'none', background: p.id === view.id ? '#ecfdf5' : 'transparent' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>
                        {p.unit} {p.id === view.id && <span style={{ fontSize: '10px', color: '#059669', marginLeft: '4px' }}>(Current)</span>}
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: '#059669' }}>{money(p.price)}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{money(p.mrp)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: Number(p.stock) <= 5 ? '#dc2626' : '#334155' }}>
                        {p.stock} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '18px' }}>
          {/* Stock Info */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
            <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, display: 'block' }}>
              Inventory Stock
            </small>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
              <b style={{ fontSize: '14px', color: view.stock <= (view.lowStockThreshold || 10) ? '#dc2626' : '#0f172a' }}>
                {view.stock} units
              </b>
              {view.stock <= (view.lowStockThreshold || 10) && (
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>
                  Low
                </span>
              )}
            </div>
            <small style={{ color: '#94a3b8', fontSize: '10px' }}>
              Alert at: {view.lowStockThreshold || 10} units
            </small>
          </div>

          {/* Pricing Info */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
            <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, display: 'block' }}>
              Pricing Breakdown
            </small>
            <div style={{ marginTop: '3px', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Selling: </span>
              <b style={{ color: '#059669' }}>{money(price)}</b>
              <span style={{ color: '#94a3b8', margin: '0 4px' }}>·</span>
              <span style={{ color: '#64748b' }}>MRP: </span>
              <b>{money(mrp)}</b>
            </div>
            <small style={{ color: '#059669', fontSize: '10px', fontWeight: 700 }}>
              {savings > 0 ? `${discount}% Discount` : 'Regular Price'}
            </small>
          </div>

          {/* SKU */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                Inventory SKU Code
              </small>
              {view.sku && (
                <button
                  type="button"
                  onClick={copySku}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copied ? '#059669' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
            <code style={{ display: 'block', fontSize: '11px', color: '#0f172a', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '4px', wordBreak: 'break-all' }}>
              {view.sku || 'N/A'}
            </code>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f1f5f9', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <button
              type="button"
              disabled={togglingSoon}
              onClick={handleToggleSoon}
              style={{
                fontSize: '11.5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: isSoon ? '1.5px solid #fde68a' : '1px solid #cbd5e1',
                background: isSoon ? '#fef3c7' : '#ffffff',
                color: isSoon ? '#b45309' : '#334155',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={isSoon ? 'Product is Coming Soon (Click to make Available)' : 'Product is Available (Click to mark Coming Soon)'}
            >
              <Clock3 size={12} />
              {isSoon ? 'Soon: ON' : 'Soon: OFF'}
            </button>
          </div>

          <Link
            className="btn btn-primary"
            to={`${basePath}/products/${view.id}/edit`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
          >
            <Edit2 size={13} />
            <span>Edit This Product</span>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

function FilterBar({q,setQ,children}){return <div className="filter-bar"><div className="filter-search"><Search/><input value={q} onChange={event=>setQ(event.target.value)} placeholder="Search by name or SKU"/></div>{children}</div>}

function ProductFormSkeleton({ basePath }) {
  return (
    <div className="product-form-skeleton-wrap" style={{ display: 'grid', gap: '18px', maxWidth: '950px' }}>
      <div className="r2c-skeleton-box" style={{ width: '130px', height: '18px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="r2c-skeleton-box" style={{ width: '220px', height: '28px', borderRadius: '6px' }} />
        <div className="r2c-skeleton-box" style={{ width: '340px', height: '14px', borderRadius: '4px' }} />
      </div>
      <div className="admin-card" style={{ padding: '22px' }}>
        <div className="r2c-skeleton-box" style={{ width: '180px', height: '20px', borderRadius: '5px', marginBottom: '8px' }} />
        <div className="r2c-skeleton-box" style={{ width: '280px', height: '12px', borderRadius: '4px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="r2c-skeleton-box" style={{ height: '170px', borderRadius: '12px' }} />
          ))}
        </div>
      </div>
      <div className="admin-card" style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="r2c-skeleton-box" style={{ height: '42px', borderRadius: '8px' }} />
        <div className="r2c-skeleton-box" style={{ height: '42px', borderRadius: '8px' }} />
        <div className="r2c-skeleton-box" style={{ height: '42px', borderRadius: '8px' }} />
        <div className="r2c-skeleton-box" style={{ height: '42px', borderRadius: '8px' }} />
        <div className="r2c-skeleton-box" style={{ height: '80px', gridColumn: '1 / -1', borderRadius: '8px' }} />
      </div>
      <div className="admin-card" style={{ padding: '22px' }}>
        <div className="r2c-skeleton-box" style={{ width: '200px', height: '20px', borderRadius: '5px', marginBottom: '14px' }} />
        <div className="r2c-skeleton-box" style={{ height: '52px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

export function ProductForm(){
 const {id}=useParams();
 const nav=useNavigate();
 const location=useLocation();
 const routeProduct = location.state?.product;
 const currentUser = getAdminUser();
 const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN' || location.pathname.startsWith('/super-admin');
 const basePath = isSuper ? '/super-admin' : '/admin';
 const {notify,refreshProducts,storeSettings,setStoreSettings}=useApp();
 const {categories,categoryError,reloadCategories}=useAdminCategories();
 const [isComingSoon, setIsComingSoon] = useState(() => {
   return isProductComingSoon(routeProduct || (id ? { id } : null), storeSettings);
 });
 const [form,setForm]=useState(() => ({
   ...emptyProduct,
   ...(routeProduct ? {
     ...routeProduct,
     mrp: routeProduct.mrp !== undefined ? String(routeProduct.mrp) : '',
     price: routeProduct.price !== undefined ? String(routeProduct.price) : '',
     stock: routeProduct.stock !== undefined ? String(routeProduct.stock) : ''
   } : {})
 }));
 const [loading,setLoading]=useState(Boolean(id && !routeProduct));
 const [saving,setSaving]=useState(false);
 const [imageList, setImageList] = useState(() => {
   if (!routeProduct) return [];
   const imgs = (routeProduct.images && routeProduct.images.length > 0)
     ? routeProduct.images
     : (routeProduct.image ? [routeProduct.image] : []);
   return imgs.map((url, i) => ({
     id: `img-${i}-${Date.now()}`,
     url,
     file: null,
     preview: url,
     originalSrc: url
   }));
 });
 const [packs, setPacks] = useState([]);
 const [loadError, setLoadError] = useState(''), [reload, setReload] = useState(0);

 // Cropper state
 const [cropperOpen, setCropperOpen] = useState(false);
 const [cropTargetIndex, setCropTargetIndex] = useState(null);
 const [rawImageToCrop, setRawImageToCrop] = useState('');
 const [cropConfig, setCropConfig] = useState({ zoom: 1, rotation: 0, offset: { x: 0, y: 0 } });
 const [urlInput, setUrlInput] = useState('');
 const [draggedIndex, setDraggedIndex] = useState(null);
 const [dragOverIndex, setDragOverIndex] = useState(null);
 const [details, setDetails] = useState(() => parseProductDetails(routeProduct?.description || ''));
 const [showBoxCalc, setShowBoxCalc] = useState(false);
 const [boxTotalCost, setBoxTotalCost] = useState('');
 const [boxPieces, setBoxPieces] = useState('');

  useEffect(() => {
    let active = true;
    setLoadError('');
    setCropConfig({ zoom: 1, rotation: 0, offset: { x: 0, y: 0 } });
    if (!id) {
      setForm(emptyProduct);
      setImageList([]);
      setPacks([]);
      setDetails(parseProductDetails(''));
      setLoading(false);
      return;
    }
    if (!routeProduct) {
      setLoading(true);
    }
    Promise.all([
      adminService.product(id),
      adminService.productVariants(id).catch(() => [])
    ])
      .then(async ([product, variants]) => {
        if (!active) return;
        const cachedHi = getCachedHindi(product.name);
        let nameHi = product.nameHi || cachedHi || '';
        setForm({ ...emptyProduct, ...product, ...(nameHi ? { nameHi } : {}) });
        setDetails(parseProductDetails(product.description));
        setIsComingSoon(isProductComingSoon(product, storeSettings));
        if (!nameHi && product.name) {
          try {
            const translated = await translateToHindi(product.name);
            if (translated && active) {
              setForm(prev => ({ ...prev, nameHi: translated }));
            }
          } catch {}
        }

        const imgs = (product.images && product.images.length > 0)
          ? product.images
          : (product.image ? [product.image] : []);
        setImageList(imgs.map((url, i) => ({
          id: `img-${i}-${Date.now()}`,
          url,
          file: null,
          preview: url,
          originalSrc: url
        })));

        const otherPacks = Array.isArray(variants)
          ? variants
              .filter(v => v.id !== product.id)
              .map(v => ({
                id: v.id,
                unit: v.unit || '',
                mrp: v.mrp !== undefined && v.mrp !== null ? String(v.mrp) : '',
                price: v.price !== undefined && v.price !== null ? String(v.price) : '',
                costPrice: v.costPrice !== undefined && v.costPrice !== null ? String(v.costPrice) : '',
                stock: v.stock !== undefined && v.stock !== null ? String(v.stock) : '',
                status: v.status || 'ACTIVE'
              }))
          : [];
        setPacks(otherPacks);
      })
      .catch(reason => {
        if (active) setLoadError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, reload]);

  useEffect(() => () => {
    imageList.forEach(item => {
      if (item.preview && item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      if (item.originalSrc && item.originalSrc.startsWith('blob:') && item.originalSrc !== item.preview) URL.revokeObjectURL(item.originalSrc);
    });
  }, [imageList]);

  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  const field=(key,label,type='text')=><label>{label}<input type={type} required min={type==='number'?0:undefined} step={['mrp','price'].includes(key)?'0.01':undefined} value={form[key]??''} onChange={event=>set(key,event.target.value)}/></label>;

  const [translatingName, setTranslatingName] = useState(false);
  const handleAutoTranslateName = async () => {
    if (!form.name || !form.name.trim()) {
      return notify('Please enter the Product Name in English first', 'error');
    }
    setTranslatingName(true);
    try {
      const translated = await translateToHindi(form.name);
      if (translated) {
        set('nameHi', translated);
        notify('✨ Hindi translation generated!');
      }
    } catch {
      notify('Could not auto-translate name', 'error');
    } finally {
      setTranslatingName(false);
    }
  };

  const handleChooseFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remaining = 8 - imageList.length;
    if (remaining <= 0) {
      return notify('Maximum 8 images allowed. Remove an image first.', 'error');
    }
    const toProcess = files.slice(0, remaining);
    const valid = [];
    for (const file of toProcess) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        notify(`Skipped "${file.name}": Only JPG, PNG, and WebP supported`, 'error');
        continue;
      }
      try {
        const compressedFile = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.82 });
        const objectUrl = URL.createObjectURL(compressedFile);
        valid.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: '',
          file: compressedFile,
          preview: objectUrl,
          originalSrc: objectUrl
        });
      } catch {
        const objectUrl = URL.createObjectURL(file);
        valid.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: '',
          file,
          preview: objectUrl,
          originalSrc: objectUrl
        });
      }
    }
    if (valid.length > 0) {
      setImageList(prev => [...prev, ...valid]);
      notify(`Added & compressed ${valid.length} image${valid.length > 1 ? 's' : ''}`);
    }
    event.target.value = '';
  };

  const handleAddFromUrl = () => {
    const trimmed = String(urlInput || '').trim();
    if (!trimmed) return;
    if (imageList.length >= 8) {
      return notify('Maximum 8 images allowed. Remove an image first.', 'error');
    }
    setImageList(prev => [
      ...prev,
      {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: trimmed,
        file: null,
        preview: trimmed,
        originalSrc: trimmed
      }
    ]);
    setUrlInput('');
    notify('Image URL added to gallery');
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const fromIndex = draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (isNaN(fromIndex) || fromIndex === targetIndex || fromIndex < 0 || targetIndex < 0) return;

    setImageList(prev => {
      if (fromIndex >= prev.length || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(targetIndex, 0, movedItem);
      return copy;
    });
    notify(targetIndex === 0 ? '⭐ Set as Primary Cover Image!' : `Image moved to Slot ${targetIndex + 1}`);
  };

  const handleMoveLeft = (e, idx) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (idx <= 0) return;
    setImageList(prev => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(idx - 1, 0, item);
      return copy;
    });
    notify(idx - 1 === 0 ? '⭐ Moved to Cover Image!' : `Image moved to Slot ${idx}`);
  };

  const handleMoveRight = (e, idx) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    setImageList(prev => {
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(idx + 1, 0, item);
      return copy;
    });
    notify(`Image moved to Slot ${idx + 2}`);
  };

  const handleRemoveImage = (indexToRemove) => {
    const item = imageList[indexToRemove];
    if (item?.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    if (item?.originalSrc?.startsWith('blob:') && item?.originalSrc !== item?.preview) URL.revokeObjectURL(item.originalSrc);
    setImageList(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSetAsCover = (e, indexToPromote) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (indexToPromote === 0) return;
    setImageList(prev => {
      if (indexToPromote <= 0 || indexToPromote >= prev.length) return prev;
      const copy = [...prev];
      const [promoted] = copy.splice(indexToPromote, 1);
      copy.unshift(promoted);
      return copy;
    });
    notify('⭐ Set as Primary Cover Image!');
  };

  const handleOpenCropperForIndex = (index) => {
    const item = imageList[index];
    if (!item) return;
    const srcToUse = item.originalSrc || item.preview || item.url;
    if (!srcToUse) return;
    setCropTargetIndex(index);
    setRawImageToCrop(srcToUse);
    setCropConfig({ zoom: 1, rotation: 0, offset: { x: 0, y: 0 } });
    setCropperOpen(true);
  };

  const handleCropDone = (croppedFile, croppedPreviewUrl, savedConfig) => {
    if (cropTargetIndex !== null && imageList[cropTargetIndex]) {
      const old = imageList[cropTargetIndex];
      if (old.preview?.startsWith('blob:') && old.preview !== old.originalSrc && old.preview !== rawImageToCrop) {
        URL.revokeObjectURL(old.preview);
      }
      setImageList(prev => prev.map((item, i) => i === cropTargetIndex ? {
        ...item,
        file: croppedFile,
        preview: croppedPreviewUrl
      } : item));
    }
    if (savedConfig) setCropConfig(savedConfig);
    setCropperOpen(false);
    setCropTargetIndex(null);
    notify(`Image cropped at ${Math.round((savedConfig?.zoom || 1) * 100)}% zoom`);
  };
 const [genIndex, setGenIndex] = useState(0);

 const handleGenerateDescription = () => {
   if (!form.name || !form.name.trim()) {
     return notify('Please enter the Product Name first to generate description', 'error');
   }
   const generated = generateProductDescription(form.name, form.category, genIndex);
   set('description', generated);
   setGenIndex((prev) => prev + 1);
   notify('✨ Product description generated successfully');
 };

 const save = async event => {
   event.preventDefault();
   setSaving(true);
   try {
     if (!form.category) throw new Error('Select a product category');
     if (!form.unit?.trim()) throw new Error('Please enter a Unit / Pack size for Pack 1');
     if (!form.mrp || Number(form.mrp) <= 0) throw new Error('Pack 1 has an invalid MRP');
     if (!form.price || Number(form.price) <= 0) throw new Error('Pack 1 has an invalid Selling Price');
     if (Number(form.price) > Number(form.mrp)) throw new Error('Pack 1: Selling price cannot exceed MRP');

     for (let i = 0; i < packs.length; i++) {
       const p = packs[i];
       const packNum = i + 2;
       if (!p.unit || !p.unit.trim()) throw new Error(`Pack ${packNum} is missing a Unit / Pack size`);
       if (!p.mrp || Number(p.mrp) <= 0) throw new Error(`Pack ${packNum} (${p.unit}) has an invalid MRP`);
       if (!p.price || Number(p.price) <= 0) throw new Error(`Pack ${packNum} (${p.unit}) has an invalid Selling Price`);
       if (Number(p.price) > Number(p.mrp)) throw new Error(`Pack ${packNum} (${p.unit}): Selling price cannot exceed MRP`);
       if (p.stock === '' || Number(p.stock) < 0) throw new Error(`Pack ${packNum} (${p.unit}) has invalid Stock`);
     }

     const units = [form, ...packs].map(pack => pack.unit.trim().toLowerCase().replace(/\s+/g, ''));
     if (new Set(units).size !== units.length) throw new Error('Each pack size must be different');

      // 1. Mandatory 1 Cover Image & max 8 validation
      if (!imageList.length) {
        throw new Error('At least 1 product image is required (Slot 1: Cover image)');
      }
      if (imageList.length > 8) {
        throw new Error('Maximum 8 product images allowed');
      }

      // 2. Concurrently upload any newly selected device files
      const uploadedUrls = await Promise.all(imageList.map(async (item) => {
        if (item.file) {
          const res = await adminService.uploadProductImage(item.file, form.category);
          return res.url;
        }
        return item.url || item.preview;
      }));

      const finalUrls = uploadedUrls.filter(Boolean);
      if (!finalUrls.length) {
        throw new Error('At least 1 product image is required (Slot 1: Cover image)');
      }

      const finalDesc = formatProductDetails(details) || form.description;
      let next = { ...form, description: finalDesc, image: finalUrls[0], images: finalUrls };
      if (next.name && next.nameHi) {
        try {
          const raw = localStorage.getItem('r2cart_auto_translations');
          const cache = raw ? JSON.parse(raw) : {};
          cache[next.name.trim()] = next.nameHi.trim();
          localStorage.setItem('r2cart_auto_translations', JSON.stringify(cache));
          window.dispatchEvent(new CustomEvent('r2cart:translation-updated', { detail: { text: next.name.trim(), hi: next.nameHi.trim() } }));
        } catch {}
      }

      const cleanPacks = packs.map(p => ({
        ...(p.id ? { id: p.id } : {}),
        unit: p.unit.trim(),
        mrp: Number(p.mrp),
        price: Number(p.price),
        stock: Number(p.stock),
        status: p.status || form.status
      }));

      const savedRes = await (id
        ? adminService.updateProduct(id, { ...payload(next), image: finalUrls[0], images: finalUrls, packs: cleanPacks })
        : adminService.createProduct({ ...payload(next), image: finalUrls[0], images: finalUrls, packs: cleanPacks }));

      const effectiveId = id || savedRes?.id || savedRes?.product?.id;
      if (effectiveId) {
        await adminService.toggleProductComingSoon(effectiveId, isComingSoon).catch(() => {});
        window.dispatchEvent(new Event('r2cart:settings-updated'));
      }

      const savedProduct = savedRes?.product || {
        ...next,
        id: id || savedRes?.id,
        image: finalUrls[0],
        images: finalUrls,
        packCount: cleanPacks.length + 1
      };

      if (adminProductsCache?.list) {
        if (id) {
          adminProductsCache.list = adminProductsCache.list.map(p => p.id === id ? { ...p, ...savedProduct } : p);
        } else {
          adminProductsCache.list = [savedProduct, ...adminProductsCache.list];
          adminProductsCache.totalProducts = (adminProductsCache.totalProducts || 0) + (cleanPacks.length + 1);
        }
      }
      adminCategoryCache.clear();

      refreshProducts().catch(() => {});
      window.dispatchEvent(new CustomEvent('r2cart:products-updated', { detail: { source: 'admin-local-action', product: savedProduct } }));
      notify(id ? 'Product and all pack sizes updated' : 'Product and all pack sizes published');
      nav(`${basePath}/products`);
   } catch (error) {
     notify(error.message, 'error');
   } finally {
     setSaving(false);
   }
 };
 if(loading)return <ProductFormSkeleton basePath={basePath}/>;
 if(loadError)return <div className="admin-card bulk-error"><p role="alert">{loadError}</p><Button variant="outline" onClick={()=>setReload(value=>value+1)}>Try again</Button><Link className="back-link" to={`${basePath}/products`}>Back to products</Link></div>;
 return <>
  <Link className="back-link" to={`${basePath}/products`}><ArrowLeft/> Back to products</Link>
  <AdminTitle title={id?'Edit product':'Add new product'} text="Saved changes are published to the customer catalogue."/>
  {categoryError&&<div className="admin-card bulk-error"><p role="alert">{categoryError}</p><Button variant="outline" onClick={reloadCategories}>Retry categories</Button></div>}
  <form className="admin-form" onSubmit={save}>
   <section className="admin-card">
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px',marginBottom:'14px'}}>
      <div>
        <h3 style={{margin:0,fontSize:'16px'}}>Product Media & Gallery</h3>
        <p style={{margin:'3px 0 0',fontSize:'12.5px',color:'#64748b'}}>
          Slot 1 is the <b>Mandatory Cover Image</b>. Slots 2–8 are gallery slides.
        </p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
        {imageList.length === 0 ? (
          <span style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:800}}>
            ⚠️ Cover Image Required (0/8)
          </span>
        ) : (
          <span style={{background:'#ecfdf5',border:'1px solid #a7f3d0',color:'#047857',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:800}}>
            ✓ {imageList.length}/8 Images Added
          </span>
        )}
      </div>
    </div>

    {/* Gallery Grid (Up to 8 slots) */}
    <div style={{
      display:'grid',
      gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',
      gap:'14px',
      marginBottom:'18px'
    }}>
      {imageList.map((img, idx) => {
        const isCover = idx === 0;
        const displaySrc = img.preview || img.url;
        const isDragging = draggedIndex === idx;
        const isDragOver = dragOverIndex === idx;
        return (
          <div
            key={img.id || idx}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              position:'relative',
              background: isDragOver ? '#ecfdf5' : '#ffffff',
              border: isDragOver ? '2px dashed #059669' : isCover ? '2px solid #059669' : '1px solid #cbd5e1',
              borderRadius:'12px',
              padding:'8px',
              display:'flex',
              flexDirection:'column',
              boxShadow: isCover ? '0 4px 12px -2px rgba(5, 150, 105, 0.15)' : 'none',
              opacity: isDragging ? 0.45 : 1,
              transform: isDragOver ? 'scale(1.02)' : 'none',
              cursor:'grab',
              transition:'all 0.18s ease'
            }}
          >
            {/* Slot Badge */}
            <div style={{
              position:'absolute',
              top:'6px',
              left:'6px',
              zIndex:2,
              background: isCover ? '#059669' : '#1e293b',
              color:'#ffffff',
              fontSize:'10px',
              fontWeight:800,
              padding:'2px 6px',
              borderRadius:'5px',
              letterSpacing:'0.3px',
              display:'flex',
              alignItems:'center',
              gap:'3px'
            }}>
              {isCover ? <><Star size={10} fill="currentColor"/> COVER *</> : `#${idx + 1} SLIDE`}
            </div>

            {/* Drag Handle Indicator */}
            <div
              style={{
                position:'absolute',
                top:'6px',
                right:'6px',
                zIndex:2,
                background:'rgba(255,255,255,0.92)',
                border:'1px solid #cbd5e1',
                borderRadius:'5px',
                padding:'2px 4px',
                display:'flex',
                alignItems:'center',
                color:'#64748b',
                cursor:'grab'
              }}
              title="Drag & Drop to reorder"
            >
              <GripVertical size={12}/>
            </div>

            {/* 1:1 Square Preview Box */}
            <div style={{
              width:'100%',
              height:'140px',
              background:'#f8fafc',
              borderRadius:'8px',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              overflow:'hidden',
              marginBottom:'8px'
            }}>
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt={`Slot ${idx + 1}`}
                  draggable={false}
                  style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',pointerEvents:'none'}}
                />
              ) : (
                <ImagePlus size={32} color="#94a3b8"/>
              )}
            </div>

            {/* Slot Action Buttons */}
            <div style={{display:'flex',flexDirection:'column',gap:'4px',marginTop:'auto'}} onMouseDown={e=>e.stopPropagation()}>
              <div style={{display:'flex',gap:'3px',alignItems:'center'}}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => handleMoveLeft(e, idx)}
                  style={{
                    background: idx === 0 ? '#f1f5f9' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 7px',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    opacity: idx === 0 ? 0.35 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e293b'
                  }}
                  title="Move Left"
                >
                  <ChevronLeft size={13} style={{pointerEvents:'none'}}/>
                </button>
                <button
                  type="button"
                  disabled={idx === imageList.length - 1}
                  onClick={(e) => handleMoveRight(e, idx)}
                  style={{
                    background: idx === imageList.length - 1 ? '#f1f5f9' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 7px',
                    cursor: idx === imageList.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: idx === imageList.length - 1 ? 0.35 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e293b'
                  }}
                  title="Move Right"
                >
                  <ChevronRight size={13} style={{pointerEvents:'none'}}/>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenCropperForIndex(idx)}
                  style={{flex:1,padding:'4px 6px',fontSize:'11px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'3px'}}
                  title="Crop & adjust image (1:1)"
                >
                  <Crop size={12}/>
                  <span>Crop</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveImage(idx)}
                  style={{padding:'4px 8px',fontSize:'11px',color:'#ef4444'}}
                  title="Remove image"
                >
                  <Trash2 size={13}/>
                </Button>
              </div>

              {!isCover && (
                <button
                  type="button"
                  onClick={(e) => handleSetAsCover(e, idx)}
                  style={{
                    background:'#ecfdf5',
                    border:'1px solid #a7f3d0',
                    color:'#047857',
                    borderRadius:'6px',
                    padding:'4px 6px',
                    fontSize:'10.5px',
                    fontWeight:700,
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:'3px'
                  }}
                  title="Move to first position as Cover Image"
                >
                  <Star size={11} fill="#047857"/>
                  <span>Make Cover</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty Slot Card for adding more */}
      {imageList.length < 8 && (
        <label
          style={{
            border:'2px dashed #cbd5e1',
            borderRadius:'12px',
            minHeight:'180px',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            padding:'16px',
            cursor:'pointer',
            background:'#fafafa',
            color:'#64748b',
            textAlign:'center',
            transition:'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChooseFiles}
            hidden
          />
          <div style={{
            width:'40px',
            height:'40px',
            borderRadius:'50%',
            background:'#ecfdf5',
            color:'#059669',
            display:'grid',
            placeItems:'center',
            marginBottom:'8px'
          }}>
            <Plus size={22}/>
          </div>
          <b style={{fontSize:'12.5px',color:'#0f172a'}}>+ Add Image</b>
          <span style={{fontSize:'11px',color:'#94a3b8',marginTop:'2px'}}>
            Slot {imageList.length + 1} of 8
          </span>
        </label>
      )}
    </div>

    {/* Bottom Add Actions */}
    <div style={{
      background:'#f8fafc',
      border:'1px solid #e2e8f0',
      borderRadius:'12px',
      padding:'12px 16px',
      display:'flex',
      flexWrap:'wrap',
      alignItems:'center',
      justifyContent:'space-between',
      gap:'12px'
    }}>
      <label className="btn btn-outline" style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12.5px'}}>
        <Upload size={14}/>
        <span>Choose from device (Multiple allowed)</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChooseFiles}
          hidden
        />
      </label>

      <div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,maxWidth:'460px'}}>
        <input
          type="url"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFromUrl(); } }}
          placeholder="Paste image URL (https://...)"
          style={{flex:1,fontSize:'12.5px',padding:'7px 10px'}}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddFromUrl}
          disabled={!urlInput.trim() || imageList.length >= 8}
          style={{fontSize:'12px',fontWeight:700}}
        >
          + Add URL
        </Button>
      </div>
    </div>
   </section>

   <section className="admin-card">
    <h3>Basic information</h3>
    <div className="form-grid">
      {field('name','Product name')}
      <label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Hindi Name (हिंदी नाम)</span>
          <button
            type="button"
            onClick={handleAutoTranslateName}
            disabled={translatingName || !form.name}
            style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              color: '#047857',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: form.name ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Auto-translate English name to Hindi"
          >
            <Sparkles size={11} color="#059669"/>
            <span>{translatingName ? 'अनुवाद हो रहा है…' : '⚡ Auto Translate'}</span>
          </button>
        </div>
        <input
          type="text"
          value={form.nameHi || ''}
          onChange={e => set('nameHi', e.target.value)}
          placeholder="उदा. अमूल ताज़ा दूध / ताज़ा सेब"
        />
      </label>
      <label>Category<select required value={form.category} onChange={event=>set('category',event.target.value)}><option value="">Choose category</option>{categories.filter(category=>category.status!=='INACTIVE').map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>
      <label>SKU · Automatic<input readOnly value={form.sku||''} placeholder="Generated automatically when you save"/><small className="muted">{id?'This inventory code stays unchanged.':'A unique inventory code will be created by the server.'}</small></label>
      <div className="full" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ margin: 0, fontSize: '12px', fontWeight: 700 }}>
            Description *
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleGenerateDescription}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                color: '#047857',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Generate description based on product name and category"
            >
              <Sparkles size={13} color="#059669" />
              <span>{form.description ? '✨ Re-generate Description' : '✨ Auto-Generate Description'}</span>
            </button>

            {form.description && (
              <button
                type="button"
                onClick={() => set('description', '')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                title="Clear text to enter manually"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          required
          rows={3}
          value={form.description}
          placeholder="Enter description manually or click '✨ Auto-Generate Description'..."
          onChange={(event) => set('description', event.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1.5px solid #e2e8f0',
            fontSize: '13px',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            resize: 'vertical'
          }}
        />
        <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
          💡 Tip: You can auto-generate and freely edit, customize, or type your own description manually anytime.
        </small>
      </div>
    </div>
   </section>

   <ProductSpecificationsEditor
     details={details}
     onChange={setDetails}
     productName={form.name}
     category={form.category}
     unit={form.unit}
     image={imageList[0]?.preview || imageList[0]?.url || form.image}
   />

   <section className="admin-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
      <div>
        <h3 style={{ margin: 0 }}>Pricing & Inventory</h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          Enter MRP, selling price, and real purchase/cost price to track your live retail profit.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowBoxCalc(prev => !prev)}
        style={{
          background: showBoxCalc ? '#ecfdf5' : '#f8fafc',
          border: '1.5px solid ' + (showBoxCalc ? '#10b981' : '#cbd5e1'),
          color: showBoxCalc ? '#047857' : '#334155',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
        title="Calculate unit cost from wholesale carton or box rate"
      >
        <span>📦 Box / Wholesale Calculator</span>
      </button>
    </div>

    {/* Box Rate Calculator Popup/Card */}
    {showBoxCalc && (
      <div style={{
        background: '#f0fdf4',
        border: '1.5px solid #86efac',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <b style={{ fontSize: '13px', color: '#166534' }}>
            📦 Wholesale Box / Carton Calculator (e.g. ₹500 for 56 pieces)
          </b>
          <button
            type="button"
            onClick={() => setShowBoxCalc(false)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            ✕ Close
          </button>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#15803d' }}>
          If you purchased a wholesale box or carton, enter the total box price and total piece count to calculate the unit cost price:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
              Total Box Cost (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 500"
              value={boxTotalCost}
              onChange={e => setBoxTotalCost(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
              Pieces per Box
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 56"
              value={boxPieces}
              onChange={e => setBoxPieces(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #86efac', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
              Calculated Cost / Unit
            </label>
            <div style={{ padding: '7px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #86efac', fontWeight: 800, color: '#047857', fontSize: '14px' }}>
              {Number(boxTotalCost) > 0 && Number(boxPieces) > 0
                ? `₹${(Number(boxTotalCost) / Number(boxPieces)).toFixed(2)} / pc`
                : '₹0.00 / pc'}
            </div>
          </div>
          <div>
            <Button
              type="button"
              disabled={!(Number(boxTotalCost) > 0 && Number(boxPieces) > 0)}
              onClick={() => {
                const perPiece = (Number(boxTotalCost) / Number(boxPieces)).toFixed(2);
                set('costPrice', perPiece);
                notify(`✅ Cost price set to ₹${perPiece} / unit!`);
              }}
              style={{ width: '100%', padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}
            >
              Apply Cost Price
            </Button>
          </div>
        </div>
      </div>
    )}

    <div className="form-grid">
      <div>
        <label style={{fontSize:'12px',fontWeight:700,display:'block',marginBottom:'6px'}}>
          Unit / Pack Size *
        </label>
        <UnitSelector
          value={form.unit}
          onChange={(val)=>set('unit',val)}
          placeholder="e.g. 500 g or 1 kg"
        />
      </div>
      {field('mrp','MRP (₹) *','number')}
      {field('price','Selling Price (₹) *','number')}
      <label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Cost Price (₹)</span>
          <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700 }}>Profit Tracking</span>
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 8.93 (Wholesale cost)"
          value={form.costPrice ?? ''}
          onChange={e => set('costPrice', e.target.value)}
        />
      </label>
      {field('stock','Stock *','number')}
      <label>Status<select value={form.status} onChange={event=>set('status',event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <label className="check-line"><input type="checkbox" checked={form.featured} onChange={event=>set('featured',event.target.checked)}/> Featured product</label>
      <label className="check-line"><input type="checkbox" checked={form.bestSeller} onChange={event=>set('bestSeller',event.target.checked)}/> Best seller</label>
    </div>

    {/* Live Profit Preview Widget */}
    {(Number(form.price) > 0 || Number(form.costPrice) > 0 || Number(form.mrp) > 0) && (
      <div style={{
        marginTop: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <small style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>MRP</small>
            <b style={{ color: '#0f172a', fontSize: '13px' }}>₹{Number(form.mrp || 0).toFixed(2)}</b>
          </div>
          <div style={{ color: '#cbd5e1' }}>→</div>
          <div>
            <small style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Selling Price</small>
            <b style={{ color: '#059669', fontSize: '13px' }}>₹{Number(form.price || 0).toFixed(2)}</b>
          </div>
          <div style={{ color: '#cbd5e1' }}>→</div>
          <div>
            <small style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Cost Price</small>
            <b style={{ color: '#475569', fontSize: '13px' }}>₹{Number(form.costPrice || 0).toFixed(2)}</b>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {Number(form.price) > 0 && Number(form.costPrice) > 0 && (
            <div style={{
              background: Number(form.price) >= Number(form.costPrice) ? '#ecfdf5' : '#fef2f2',
              border: '1px solid ' + (Number(form.price) >= Number(form.costPrice) ? '#a7f3d0' : '#fecaca'),
              color: Number(form.price) >= Number(form.costPrice) ? '#047857' : '#b91c1c',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800 }}>
                {Number(form.price) >= Number(form.costPrice) ? 'Profit / Unit:' : 'Loss / Unit:'}
              </span>
              <b style={{ fontSize: '14px' }}>
                ₹{(Number(form.price) - Number(form.costPrice)).toFixed(2)}
              </b>
              <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.85 }}>
                ({((Number(form.price) - Number(form.costPrice)) / Number(form.price) * 100).toFixed(1)}% Margin)
              </span>
            </div>
          )}

          {Number(form.mrp) > Number(form.price) && Number(form.price) > 0 && (
            <span style={{ fontSize: '11.5px', color: '#059669', background: '#e6fffa', border: '1px solid #b2f5ea', padding: '5px 10px', borderRadius: '8px', fontWeight: 700 }}>
              Customer Discount: ₹{(Number(form.mrp) - Number(form.price)).toFixed(2)} ({Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)}% OFF)
            </span>
          )}
        </div>
      </div>
    )}
   </section>

   <NewProductPacks basePack={form} packs={packs} onChange={setPacks} disabled={saving} />

   <section className="admin-card">
    <h3>Stock alert threshold</h3>
    <label>Notify when stock is at or below<input type="number" min="0" step="1" value={form.lowStockThreshold} placeholder="Use the backend default" onChange={event=>set('lowStockThreshold',event.target.value)}/></label>
   </section>

   <section className="admin-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '15px' }}>Coming Soon Status</h3>
        <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
          Mark this product individually as Coming Soon so customers can view it on the storefront but cannot purchase yet.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsComingSoon(v => !v)}
        style={{
          fontSize: '12px',
          padding: '6px 14px',
          borderRadius: '8px',
          border: isComingSoon ? '1.5px solid #fde68a' : '1px solid #cbd5e1',
          background: isComingSoon ? '#fef3c7' : '#f8fafc',
          color: isComingSoon ? '#b45309' : '#334155',
          cursor: 'pointer',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Clock3 size={14} />
        {isComingSoon ? 'Soon: ON' : 'Soon: OFF'}
      </button>
    </div>
   </section>

   {/* Delivery & Shipping Scope Section */}
   <section className="admin-card">
    <div style={{ marginBottom: '14px' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🚚 Delivery & Shipping Scope</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '12px',
          background: form.deliveryScope === 'PAN_INDIA' ? '#ede9fe' : (form.deliveryScope === 'CUSTOM' ? '#e0f2fe' : '#f1f5f9'),
          color: form.deliveryScope === 'PAN_INDIA' ? '#6d28d9' : (form.deliveryScope === 'CUSTOM' ? '#0369a1' : '#475569')
        }}>
          {form.deliveryScope === 'PAN_INDIA' ? '🇮🇳 Pan-India' : (form.deliveryScope === 'CUSTOM' ? '📍 Specific Locations' : '🏘️ Local Area Only')}
        </span>
      </h3>
      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
        Configure where this product can be ordered from. Local grocery items are limited to local serviceable villages, while crafts, gifts, and dry items can be delivered pan-India.
      </p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
      {/* Option 1: Local */}
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `2px solid ${!form.deliveryScope || form.deliveryScope === 'LOCAL' ? '#10b981' : '#e2e8f0'}`,
        background: !form.deliveryScope || form.deliveryScope === 'LOCAL' ? '#f0fdf4' : '#fff',
        cursor: 'pointer'
      }}>
        <input
          type="radio"
          name="deliveryScope"
          value="LOCAL"
          checked={!form.deliveryScope || form.deliveryScope === 'LOCAL'}
          onChange={() => set('deliveryScope', 'LOCAL')}
          style={{ marginTop: '2px' }}
        />
        <div>
          <b style={{ fontSize: '13px', color: '#0f172a' }}>🏘️ Local Area Only</b>
          <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
            Deliverable only in standard serviceable villages / delivery areas (Instant & Scheduled delivery).
          </p>
        </div>
      </label>

      {/* Option 2: Pan-India */}
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `2px solid ${form.deliveryScope === 'PAN_INDIA' ? '#8b5cf6' : '#e2e8f0'}`,
        background: form.deliveryScope === 'PAN_INDIA' ? '#f5f3ff' : '#fff',
        cursor: 'pointer'
      }}>
        <input
          type="radio"
          name="deliveryScope"
          value="PAN_INDIA"
          checked={form.deliveryScope === 'PAN_INDIA'}
          onChange={() => set('deliveryScope', 'PAN_INDIA')}
          style={{ marginTop: '2px' }}
        />
        <div>
          <b style={{ fontSize: '13px', color: '#6d28d9' }}>🇮🇳 Pan-India (All Over India)</b>
          <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
            Deliverable to any pin code across India via courier shipment.
          </p>
        </div>
      </label>

      {/* Option 3: Custom Locations */}
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `2px solid ${form.deliveryScope === 'CUSTOM' ? '#0284c7' : '#e2e8f0'}`,
        background: form.deliveryScope === 'CUSTOM' ? '#f0f9ff' : '#fff',
        cursor: 'pointer'
      }}>
        <input
          type="radio"
          name="deliveryScope"
          value="CUSTOM"
          checked={form.deliveryScope === 'CUSTOM'}
          onChange={() => set('deliveryScope', 'CUSTOM')}
          style={{ marginTop: '2px' }}
        />
        <div>
          <b style={{ fontSize: '13px', color: '#0369a1' }}>📍 Specific Locations</b>
          <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
            Deliverable only to selected cities, states, or pin codes.
          </p>
        </div>
      </label>
    </div>

    {/* Custom Locations Input */}
    {form.deliveryScope === 'CUSTOM' && (
      <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
          Allowed Cities / States / Pincodes (Comma separated) *
        </label>
        <input
          type="text"
          value={Array.isArray(form.deliveryLocations) ? form.deliveryLocations.join(', ') : (form.deliveryLocations || '')}
          onChange={e => set('deliveryLocations', e.target.value.split(',').map(s => s.trim()))}
          placeholder="e.g. 110001, Delhi, Mumbai, Bihar, 800001"
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
        />
        <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
          Customers with addresses matching any of these pincodes, cities, or states will be allowed to order.
        </small>
      </div>
    )}

    {/* Shipping / Courier Fee Field (Optional) */}
    {(form.deliveryScope === 'PAN_INDIA' || form.deliveryScope === 'CUSTOM') && (
      <div style={{ maxWidth: '300px' }}>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
          Extra Courier / Shipping Fee (₹)
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={form.shippingFee ?? ''}
          onChange={e => set('shippingFee', e.target.value)}
          placeholder="0 for free shipping, or e.g. 50"
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
        />
        <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
          Leave 0 or blank for free delivery, or enter courier shipping charge.
        </small>
      </div>
    )}
   </section>

   {/* Customer Order & Inquiry Mode */}
   <section style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#fafaf9', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🛒</span> Product Purchase & Inquiry Mode
        </h4>
        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
          Choose how customers interact with this product: direct purchase, custom enquiry/contact request, or both.
        </p>
      </div>
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '6px',
        background: form.orderMode === 'CONTACT_REQUEST' ? '#fff7ed' : (form.orderMode === 'BOTH' ? '#f0fdf4' : '#eff6ff'),
        color: form.orderMode === 'CONTACT_REQUEST' ? '#c2410c' : (form.orderMode === 'BOTH' ? '#15803d' : '#1d4ed8')
      }}>
        {form.orderMode === 'CONTACT_REQUEST' ? '📞 Contact / Enquiry Only' : (form.orderMode === 'BOTH' ? '🔀 Direct Order & Enquiry' : '🛒 Direct Order Only')}
      </span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
      {/* 1. Direct Order Only */}
      <label style={{
        display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '8px', cursor: 'pointer',
        border: `2px solid ${!form.orderMode || form.orderMode === 'DIRECT_ORDER' ? '#2563eb' : '#e2e8f0'}`,
        background: !form.orderMode || form.orderMode === 'DIRECT_ORDER' ? '#eff6ff' : '#fff',
        transition: 'all 0.15s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="radio"
            name="orderMode"
            value="DIRECT_ORDER"
            checked={!form.orderMode || form.orderMode === 'DIRECT_ORDER'}
            onChange={() => set('orderMode', 'DIRECT_ORDER')}
            style={{ accentColor: '#2563eb' }}
          />
          <b style={{ fontSize: '13px', color: '#1e293b' }}>🛒 Direct Order Only</b>
        </div>
        <span style={{ fontSize: '11.5px', color: '#64748b', paddingLeft: '24px' }}>
          Customer clicks "Add to Cart" and checks out directly online. Standard e-commerce flow.
        </span>
      </label>

      {/* 2. Contact Request Only */}
      <label style={{
        display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '8px', cursor: 'pointer',
        border: `2px solid ${form.orderMode === 'CONTACT_REQUEST' ? '#ea580c' : '#e2e8f0'}`,
        background: form.orderMode === 'CONTACT_REQUEST' ? '#fff7ed' : '#fff',
        transition: 'all 0.15s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="radio"
            name="orderMode"
            value="CONTACT_REQUEST"
            checked={form.orderMode === 'CONTACT_REQUEST'}
            onChange={() => set('orderMode', 'CONTACT_REQUEST')}
            style={{ accentColor: '#ea580c' }}
          />
          <b style={{ fontSize: '13px', color: '#1e293b' }}>📞 Contact / Enquiry Only</b>
        </div>
        <span style={{ fontSize: '11.5px', color: '#64748b', paddingLeft: '24px' }}>
          Disables direct checkout. Shows "Contact / Enquire" button for personalized requests, wedding floral frames, quotes, or custom art.
        </span>
      </label>

      {/* 3. Both Direct Order & Contact Request */}
      <label style={{
        display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '8px', cursor: 'pointer',
        border: `2px solid ${form.orderMode === 'BOTH' ? '#16a34a' : '#e2e8f0'}`,
        background: form.orderMode === 'BOTH' ? '#f0fdf4' : '#fff',
        transition: 'all 0.15s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="radio"
            name="orderMode"
            value="BOTH"
            checked={form.orderMode === 'BOTH'}
            onChange={() => set('orderMode', 'BOTH')}
            style={{ accentColor: '#16a34a' }}
          />
          <b style={{ fontSize: '13px', color: '#1e293b' }}>🔀 Both Order & Enquiry</b>
        </div>
        <span style={{ fontSize: '11.5px', color: '#64748b', paddingLeft: '24px' }}>
          Customer can either purchase the ready-made item directly OR send a customization inquiry.
        </span>
      </label>
    </div>
   </section>

   <div className="form-actions">
     <Button type="button" variant="ghost" disabled={saving} onClick={()=>nav(`${basePath}/products`)}>Cancel</Button>
     <Button disabled={saving||!!categoryError}>{saving?'Saving…':'Save product'}</Button>
   </div>
  </form>

  <ImageCropperModal
    open={cropperOpen}
    imageSrc={rawImageToCrop}
    initialZoom={cropConfig.zoom}
    initialRotation={cropConfig.rotation}
    initialOffset={cropConfig.offset}
    onCropDone={handleCropDone}
    onCancel={()=>setCropperOpen(false)}
  />
 </>;
}
