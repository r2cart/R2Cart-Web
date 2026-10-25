function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('grocify-admin-user')) || null;
  } catch {
    return null;
  }
}
import { hasPermission } from '../../utils/permissions';
import {useEffect,useState} from 'react';
import {Link,useLocation,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {ArrowLeft,Check,Copy,Crop,Edit2,Eye,ImagePlus,LayoutGrid,Package,Plus,Search,Sparkles,Table as TableIcon,Trash2} from 'lucide-react';
import {Button,ConfirmDialog,Modal,Pagination,StatusBadge,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import ProductVariants from '../../components/admin/ProductVariants';
import NewProductPacks from '../../components/admin/NewProductPacks';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import UnitSelector from '../../components/admin/UnitSelector';
import useAdminCategories from '../../hooks/useAdminCategories';
import { generateProductDescription } from '../../utils/productDescriptionGenerator';
import { translateToHindi, getCachedHindi } from '../../utils/translator';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const emptyProduct={name:'',nameHi:'',category:'',unit:'',mrp:'',price:'',stock:'',lowStockThreshold:'',sku:'',description:'',image:'',status:'ACTIVE',featured:false,bestSeller:false};
const payload=product=>({name:product.name,category:product.category,unit:product.unit,mrp:Number(product.mrp),price:Number(product.price),stock:Number(product.stock),...(product.lowStockThreshold!==''&&{lowStockThreshold:Number(product.lowStockThreshold)}),description:product.description,image:product.image||'',status:product.status==='Active'?'ACTIVE':product.status,featured:Boolean(product.featured),bestSeller:Boolean(product.bestSeller)});

let adminProductsCache = null;

export function AdminProducts(){
 const {notify,refreshProducts}=useApp();
 const currentUser = getAdminUser();
 const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN';
 const basePath = isSuper ? '/super-admin' : '/admin';
 const canCreate = isSuper || hasPermission(currentUser, 'products.create');
 const canEdit = isSuper || hasPermission(currentUser, 'products.edit');
 const canDelete = isSuper || hasPermission(currentUser, 'products.edit');
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

 useEffect(() => {
   const c = searchParams.get('cat') || searchParams.get('category');
   if (c && c !== cat) {
     setCat(c);
     setPage(1);
   }
   const v = searchParams.get('view');
   if (v && (v === 'cards' || v === 'table')) {
     setViewMode(v);
   }
 }, [searchParams]);

 useEffect(()=>{
   let active=true;
   if(!adminProductsCache) setLoading(true);
   const timer=setTimeout(()=>{
     adminService.productsPage({page,limit:20,q,...(cat!=='all'&&{category:cat}),...(stock!=='all'&&{stock}),...(status!=='all'&&{status})})
       .then(result=>{
         if(!active)return;
         adminProductsCache={list:result.products,pagination:result.pagination,totalProducts:result.totalProducts};
         setList(result.products);
         setPagination(result.pagination);
         setTotalProducts(result.totalProducts);
         setError('');
       })
       .catch(reason=>{if(active){setList([]);setError(reason.message)}})
       .finally(()=>{if(active)setLoading(false)});
   }, 150);
   return()=>{active=false;clearTimeout(timer)};
 },[page,q,cat,stock,status,refresh]);
 useEffect(()=>{
   const onSync=()=>{adminProductsCache=null;setRefresh(v=>v+1);};
   window.addEventListener('grocify:orders-updated',onSync);
   window.addEventListener('grocify:products-updated',onSync);
   return()=>{
     window.removeEventListener('grocify:orders-updated',onSync);
     window.removeEventListener('grocify:products-updated',onSync);
   };
 },[]);
 const changeFilter=setter=>value=>{setter(value);setPage(1)};

 const toggle=async product=>{adminProductsCache=null;setBusy(product.id);try{const next=product.status==='ACTIVE'?'INACTIVE':'ACTIVE';await adminService.updateProductStatus(product.id,next);setRefresh(value=>value+1);await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(`"${product.name}" is now ${next==='ACTIVE'?'visible in store':'hidden from store'}`,'success')}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};
 const destroy=async()=>{adminProductsCache=null;const product=confirm;if(!product)return;setBusy(product.id);try{await adminService.deleteProduct(product.id);setConfirm(null);if(list.length===1&&page>1)setPage(value=>value-1);setRefresh(value=>value+1);await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(`"${product.name}" deleted successfully`,'success')}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};
 const destroyAll=async()=>{adminProductsCache=null;setBusy('all');try{const res=await adminService.deleteAllProducts();setDeleteAllConfirm(false);setPage(1);setRefresh(value=>value+1);await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(res?.message||'All products deleted')}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};
  const destroyCategoryProducts=async()=>{adminProductsCache=null;
    const target=deleteCatConfirm;
    if(!target)return;
    setBusy('cat-delete');
    try{
      const res=await adminService.deleteProductsByCategory(target.slug||target.id);
      setDeleteCatConfirm(null);
      setPage(1);
      setRefresh(v=>v+1);
      await refreshProducts();
      window.dispatchEvent(new Event('grocify:products-updated'));
      notify(res?.message||`All products in "${target.name}" deleted successfully`,'success');
    }catch(err){
      notify(err.message||'Failed to delete category products','error');
    }finally{
      setBusy('');
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
        <Link className="btn btn-outline" to={`${basePath}/products/import`} style={{display:'inline-flex',alignItems:'center',gap:'6px'}}>
          Bulk import
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
   <select value={cat} onChange={event=>changeFilter(setCat)(event.target.value)}><option value="all">All categories</option>{categories.map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select>
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
       <div style={{gridColumn:'1/-1',padding:'30px',textAlign:'center',color:'var(--muted)'}}>Loading products in cards…</div>
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
         return (
           <div key={product.id} className="product-card-shape">
             <div className="card-shape-media">
               {product.image ? (
                 <img src={product.image} alt={product.name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
               ) : (
                 <Package size={44} color="#94a3b8" />
               )}
               {hasDiscount && <span className="card-discount-pill">{discountPct}% OFF</span>}
               <span className={`card-stock-pill ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                 {isOutOfStock ? '0 left' : isLowStock ? `${product.stock} Low` : `${product.stock} in stock`}
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
                 <strong className="card-selling-price">{money(product.price)}</strong>
                 {hasDiscount && <del className="card-mrp-price">{money(product.mrp)}</del>}
               </div>
               <div className="card-action-bar">
                 <button type="button" className="card-detail-btn" onClick={() => inspect(product.id)} title="View details"><Eye size={14}/> Details</button>
                 <Link to={`${basePath}/products/${product.id}/edit`} className="card-icon-action-btn" title="Edit"><Edit2 size={14}/></Link>
                 <button type="button" disabled={!!busy} className={`card-icon-action-btn ${product.status === 'ACTIVE' ? 'active-toggle' : 'inactive-toggle'}`} onClick={() => toggle(product)} title="Toggle status"><Check size={14}/></button>
                 <button type="button" disabled={!!busy} className="card-icon-action-btn" style={{color:'#ef4444'}} onClick={() => setConfirm(product)} title="Delete product"><Trash2 size={14}/></button>
               </div>
             </div>
           </div>
         );
       })
     )}
   </div>
  ) : (
   <div className="admin-card table-card"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>MRP</th><th>Selling price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    {loading?<tr><td colSpan="8">Loading products…</td></tr>:error?<tr><td colSpan="8"><p role="alert">{error}</p><Button variant="outline" onClick={()=>setRefresh(value=>value+1)}>Try again</Button></td></tr>:!list.length?<tr><td colSpan="8">{totalProducts?'No products match these filters.':'No products yet. Add your first product or use bulk import.'}</td></tr>:list.map(product=><tr key={product.id}><td><div className="product-cell">{product.image&&<img src={product.image} alt=""/>}<span><div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}><b>{product.name}</b>{product.packCount>1&&<span style={{background:'#ecfdf5',color:'#047857',border:'1px solid #a7f3d0',borderRadius:'12px',padding:'1px 7px',fontSize:'10.5px',fontWeight:800}}>📦 {product.packCount} Packs</span>}</div><small>{product.sku}</small></span></div></td><td>{product.categoryName||product.category}</td><td><b>{product.unit}</b>{product.packCount>1&&<small style={{display:'block',color:'#059669',fontSize:'11px',fontWeight:700,marginTop:'2px'}}>+{product.packCount-1} more size{product.packCount>2?'s':''}</small>}</td><td>{money(product.mrp)}</td><td><b>{money(product.price)}</b></td><td><span className={product.stock<=product.lowStockThreshold?'text-danger':''}><b>{product.stock}</b></span>{product.stock<=0?<span className="badge badge-red" style={{marginLeft:'6px',fontSize:'10px'}}>0 left</span>:product.stock<=product.lowStockThreshold?<span className="badge badge-amber" style={{marginLeft:'6px',fontSize:'10px'}}>Low</span>:null}</td><td><button disabled={!!busy} onClick={()=>toggle(product)} aria-label="Toggle product status"><StatusBadge status={product.status==='ACTIVE'?'Active':'Inactive'}/></button></td><td><div className="table-actions"><button disabled={!!busy} aria-label="View product" onClick={()=>inspect(product.id)}><Eye/></button><Link aria-label="Edit product" to={`${basePath}/products/${product.id}/edit`}><Edit2/></Link><button disabled={!!busy} aria-label="Delete product" onClick={()=>setConfirm(product)}><Trash2/></button></div></td></tr>)}
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
  const [copied, setCopied] = useState(false);
  if (!view) return null;

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
          {view.image ? (
            <img
              src={view.image}
              alt={view.name}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '4px',
                flexShrink: 0
              }}
            />
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

              {view.unit && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', background: '#ffffff', padding: '2px 7px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                  {view.unit}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>

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

export function ProductForm(){
 const {id}=useParams();
 const nav=useNavigate();
 const location=useLocation();
 const currentUser = getAdminUser();
 const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN' || location.pathname.startsWith('/super-admin');
 const basePath = isSuper ? '/super-admin' : '/admin';
 const {notify,refreshProducts}=useApp();
 const {categories,categoryError,reloadCategories}=useAdminCategories();
 const [form,setForm]=useState(emptyProduct);
 const [loading,setLoading]=useState(Boolean(id));
 const [saving,setSaving]=useState(false);
 const [imageFile,setImageFile]=useState(null);
 const [preview,setPreview]=useState('');
 const [packs,setPacks]=useState([]);
 const [loadError,setLoadError]=useState(''),[reload,setReload]=useState(0);

 // Cropper state
 const [cropperOpen, setCropperOpen] = useState(false);
 const [rawImageToCrop, setRawImageToCrop] = useState('');
 const [originalImageSrc, setOriginalImageSrc] = useState('');
 const [cropConfig, setCropConfig] = useState({ zoom: 1, rotation: 0, offset: { x: 0, y: 0 } });

 useEffect(() => {
   let active = true;
   setLoadError('');
   setImageFile(null);
   setPreview('');
   setPacks([]);
   setCropConfig({ zoom: 1, rotation: 0, offset: { x: 0, y: 0 } });
   setOriginalImageSrc('');
   if (!id) {
     setForm(emptyProduct);
     setLoading(false);
     return;
   }
   setLoading(true);
   Promise.all([
     adminService.product(id),
     adminService.productVariants(id).catch(() => [])
   ])
     .then(async ([product, variants]) => {
       if (!active) return;
       const cachedHi = getCachedHindi(product.name);
       let nameHi = product.nameHi || cachedHi || '';
       setForm({ ...emptyProduct, ...product, ...(nameHi ? { nameHi } : {}) });
       if (!nameHi && product.name) {
         try {
           const translated = await translateToHindi(product.name);
           if (translated && active) {
             setForm(prev => ({ ...prev, nameHi: translated }));
           }
         } catch {}
       }
       const otherPacks = Array.isArray(variants)
         ? variants
             .filter(v => v.id !== product.id)
             .map(v => ({
               id: v.id,
               unit: v.unit || '',
               mrp: v.mrp !== undefined && v.mrp !== null ? String(v.mrp) : '',
               price: v.price !== undefined && v.price !== null ? String(v.price) : '',
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
 useEffect(()=>()=>{
   if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);
   if(originalImageSrc.startsWith('blob:')&&originalImageSrc!==preview)URL.revokeObjectURL(originalImageSrc);
 },[preview,originalImageSrc]);
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

 const chooseImage=(event)=>{
   const file=event.target.files?.[0];
   if(!file)return;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type))return notify('Choose a JPG, PNG or WebP image','error');
   if(file.size>10*1024*1024)return notify('Image must be smaller than 10 MB','error');
   const objectUrl=URL.createObjectURL(file);
   setOriginalImageSrc(objectUrl);
   setRawImageToCrop(objectUrl);
   setCropConfig({ zoom: 1, rotation: 0, offset: { x: 0, y: 0 } });
   setCropperOpen(true);
   event.target.value='';
 };

 const handleCropDone=(croppedFile,croppedPreviewUrl,savedConfig)=>{
   if(preview&&preview.startsWith('blob:')&&preview!==rawImageToCrop&&preview!==originalImageSrc){
     URL.revokeObjectURL(preview);
   }
   setImageFile(croppedFile);
   setPreview(croppedPreviewUrl);
   if(savedConfig){
     setCropConfig(savedConfig);
   }
   setCropperOpen(false);
   notify(`Image cropped at ${Math.round((savedConfig?.zoom||1)*100)}% zoom`);
 };

 const handleOpenCropperForCurrent=()=>{
   const srcToUse=originalImageSrc||preview||form.image;
   if(!srcToUse)return;
   setRawImageToCrop(srcToUse);
   setCropperOpen(true);
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

     let next = form;
     if (imageFile) {
       const uploaded = await adminService.uploadProductImage(imageFile, form.category);
       next = { ...form, image: uploaded.url };
     }
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

     await (id
       ? adminService.updateProduct(id, { ...payload(next), packs: cleanPacks })
       : adminService.createProduct({ ...payload(next), packs: cleanPacks }));

     await refreshProducts();
     window.dispatchEvent(new Event('grocify:products-updated'));
     notify(id ? 'Product and all pack sizes updated' : 'Product and all pack sizes published');
     nav(`${basePath}/products`);
   } catch (error) {
     notify(error.message, 'error');
   } finally {
     setSaving(false);
   }
 };
 if(loading)return <div className="admin-card modal-body">Loading product…</div>;
 if(loadError)return <div className="admin-card bulk-error"><p role="alert">{loadError}</p><Button variant="outline" onClick={()=>setReload(value=>value+1)}>Try again</Button><Link className="back-link" to={`${basePath}/products`}>Back to products</Link></div>;
 return <>
  <Link className="back-link" to={`${basePath}/products`}><ArrowLeft/> Back to products</Link>
  <AdminTitle title={id?'Edit product':'Add new product'} text="Saved changes are published to the customer catalogue."/>
  {categoryError&&<div className="admin-card bulk-error"><p role="alert">{categoryError}</p><Button variant="outline" onClick={reloadCategories}>Retry categories</Button></div>}
  <form className="admin-form" onSubmit={save}>
   <section className="admin-card">
    <h3>Product media</h3>
    <div className="upload-box">
      {(preview||form.image)?(
        <div style={{textAlign:'center',marginBottom:'14px'}}>
          <img src={preview||form.image} alt="Product preview" className="upload-preview" style={{width:'160px',height:'160px',objectFit:'contain',borderRadius:'14px',border:'2px solid #059669',background:'#f8fafc',padding:'6px'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'10px'}}>
            <Button type="button" variant="outline" onClick={handleOpenCropperForCurrent} style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'12px'}}>
              <Crop size={14}/>
              <span>Crop & Adjust (1:1)</span>
            </Button>
            <Button type="button" variant="ghost" onClick={()=>{if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview);if(originalImageSrc?.startsWith('blob:')&&originalImageSrc!==preview)URL.revokeObjectURL(originalImageSrc);setImageFile(null);setPreview('');setOriginalImageSrc('');setCropConfig({zoom:1,rotation:0,offset:{x:0,y:0}});set('image','');}} style={{color:'#ef4444',fontSize:'12px'}}>
              Remove
            </Button>
          </div>
        </div>
      ):<ImagePlus size={40} color="#059669"/>}
      <b>Upload product image</b>
      <span>JPG, PNG or WebP · Auto-crops to 1:1 square ratio</span>
      <label className="btn btn-outline" style={{cursor:'pointer'}}>
        Choose from device
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} hidden/>
      </label>
      <span>or paste an image URL</span>
      <div style={{display:'flex',gap:'8px',width:'100%',maxWidth:'420px'}}>
        <input type="url" value={form.image||''} onChange={event=>{set('image',event.target.value);setImageFile(null);setPreview('')}} placeholder="https://example.com/product.jpg" style={{flex:1}}/>
        {form.image&&(
          <Button type="button" variant="outline" onClick={handleOpenCropperForCurrent} title="Crop image from URL">
            <Crop size={15}/>
          </Button>
        )}
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

   <section className="admin-card">
    <h3>Pricing & inventory</h3>
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
      {field('mrp','MRP','number')}
      {field('price','Selling price','number')}
      {field('stock','Stock','number')}
      <label>Status<select value={form.status} onChange={event=>set('status',event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <label className="check-line"><input type="checkbox" checked={form.featured} onChange={event=>set('featured',event.target.checked)}/> Featured product</label>
      <label className="check-line"><input type="checkbox" checked={form.bestSeller} onChange={event=>set('bestSeller',event.target.checked)}/> Best seller</label>
    </div>
   </section>

   <NewProductPacks basePack={form} packs={packs} onChange={setPacks} disabled={saving} />

   <section className="admin-card">
    <h3>Stock alert threshold</h3>
    <label>Notify when stock is at or below<input type="number" min="0" step="1" value={form.lowStockThreshold} placeholder="Use the backend default" onChange={event=>set('lowStockThreshold',event.target.value)}/></label>
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
