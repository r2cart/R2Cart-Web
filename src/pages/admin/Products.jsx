import {useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,Edit2,Eye,ImagePlus,Plus,Search,Trash2} from 'lucide-react';
import {Button,Modal,Pagination,StatusBadge,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import ProductVariants from '../../components/admin/ProductVariants';
import NewProductPacks from '../../components/admin/NewProductPacks';
import useAdminCategories from '../../hooks/useAdminCategories';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const emptyProduct={name:'',category:'',unit:'',mrp:'',price:'',stock:'',lowStockThreshold:'',sku:'',description:'',image:'',status:'ACTIVE',featured:false,bestSeller:false};
const payload=product=>({name:product.name,category:product.category,unit:product.unit,mrp:Number(product.mrp),price:Number(product.price),stock:Number(product.stock),...(product.lowStockThreshold!==''&&{lowStockThreshold:Number(product.lowStockThreshold)}),description:product.description,image:product.image||'',status:product.status==='Active'?'ACTIVE':product.status,featured:Boolean(product.featured),bestSeller:Boolean(product.bestSeller)});

export function AdminProducts(){
 const {notify,refreshProducts}=useApp();
 const {categories,categoryError,reloadCategories}=useAdminCategories();
 const [q,setQ]=useState('');
 const [cat,setCat]=useState('all');
 const [stock,setStock]=useState('all');
 const [status,setStatus]=useState('all');
 const [list,setList]=useState([]);
 const [loading,setLoading]=useState(true);
 const [confirm,setConfirm]=useState(null);
 const [deleteAllConfirm,setDeleteAllConfirm]=useState(false);
 const [error,setError]=useState(''),[busy,setBusy]=useState(''),[view,setView]=useState(null);
 const [page,setPage]=useState(1),[pagination,setPagination]=useState({pages:1,total:0}),[totalProducts,setTotalProducts]=useState(0),[refresh,setRefresh]=useState(0);

 useEffect(()=>{let active=true;setLoading(true);const timer=setTimeout(()=>{adminService.productsPage({page,limit:20,q,...(cat!=='all'&&{category:cat}),...(stock!=='all'&&{stock}),...(status!=='all'&&{status})}).then(result=>{if(!active)return;setList(result.products);setPagination(result.pagination);setTotalProducts(result.totalProducts);setError('')}).catch(reason=>{if(active){setList([]);setError(reason.message)}}).finally(()=>{if(active)setLoading(false)})},200);return()=>{active=false;clearTimeout(timer)}},[page,q,cat,stock,status,refresh]);
 useEffect(()=>{const onSync=()=>setRefresh(v=>v+1);window.addEventListener('focus',onSync);window.addEventListener('grocify:orders-updated',onSync);window.addEventListener('grocify:products-updated',onSync);return()=>{window.removeEventListener('focus',onSync);window.removeEventListener('grocify:orders-updated',onSync);window.removeEventListener('grocify:products-updated',onSync)}},[]);
 const changeFilter=setter=>value=>{setter(value);setPage(1)};

 const toggle=async product=>{setBusy(product.id);try{const next=product.status==='ACTIVE'?'INACTIVE':'ACTIVE';await adminService.updateProductStatus(product.id,next);setRefresh(value=>value+1);await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(next==='ACTIVE'?'Product activated':'Product deactivated')}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};
 const destroy=async()=>{const product=confirm;if(!product)return;setBusy(product.id);try{await adminService.deleteProduct(product.id);setConfirm(null);if(list.length===1&&page>1)setPage(value=>value-1);setRefresh(value=>value+1);await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify('Product deleted')}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};
 const destroyAll=async()=>{setBusy('all');try{const res=await adminService.deleteAllProducts();setDeleteAllConfirm(false);setPage(1);setRefresh(value=>value+1);await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(res?.message||'All products deleted')}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};
 const inspect=async id=>{setBusy(id);try{setView(await adminService.product(id))}catch(reason){notify(reason.message,'error')}finally{setBusy('')}};

 return <>
  <AdminTitle title="Products" text={loading?'Loading catalogue…':error?'Catalogue unavailable':`${totalProducts} sellable packs · ${pagination.total} matching your filters`} action={<div className="bulk-upload-actions">{totalProducts>0&&<Button variant="danger" disabled={!!busy} onClick={()=>setDeleteAllConfirm(true)}><Trash2 size={16}/> Delete all</Button>}<Link className="btn btn-outline" to="/admin/products/import">Bulk import</Link><Link className="btn btn-primary" to="/admin/products/new"><Plus/> Add product</Link></div>}/>
  {categoryError&&<div className="admin-card bulk-error">{categoryError}<Button variant="outline" onClick={reloadCategories}>Retry categories</Button></div>}
  <FilterBar q={q} setQ={changeFilter(setQ)}>
   <select value={cat} onChange={event=>changeFilter(setCat)(event.target.value)}><option value="all">All categories</option>{categories.map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select>
   <select value={stock} onChange={event=>changeFilter(setStock)(event.target.value)}><option value="all">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
   <select value={status} onChange={event=>changeFilter(setStatus)(event.target.value)}><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
  </FilterBar>
  <div className="admin-card table-card"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>MRP</th><th>Selling price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
   {loading?<tr><td colSpan="8">Loading products…</td></tr>:error?<tr><td colSpan="8"><p role="alert">{error}</p><Button variant="outline" onClick={()=>setRefresh(value=>value+1)}>Try again</Button></td></tr>:!list.length?<tr><td colSpan="8">{totalProducts?'No products match these filters.':'No products yet. Add your first product or use bulk import.'}</td></tr>:list.map(product=><tr key={product.id}><td><div className="product-cell">{product.image&&<img src={product.image} alt=""/>}<span><b>{product.name}</b><small>{product.sku}</small></span></div></td><td>{product.categoryName||product.category}</td><td>{product.unit}</td><td>{money(product.mrp)}</td><td><b>{money(product.price)}</b></td><td><span className={product.stock<=product.lowStockThreshold?'text-danger':''}><b>{product.stock}</b></span>{product.stock<=0?<span className="badge badge-red" style={{marginLeft:'6px',fontSize:'10px'}}>0 left</span>:product.stock<=product.lowStockThreshold?<span className="badge badge-amber" style={{marginLeft:'6px',fontSize:'10px'}}>Low</span>:null}</td><td><button disabled={!!busy} onClick={()=>toggle(product)} aria-label="Toggle product status"><StatusBadge status={product.status==='ACTIVE'?'Active':'Inactive'}/></button></td><td><div className="table-actions"><button disabled={!!busy} aria-label="View product" onClick={()=>inspect(product.id)}><Eye/></button><Link aria-label="Edit product" to={`/admin/products/${product.id}/edit`}><Edit2/></Link><button disabled={!!busy} aria-label="Delete product" onClick={()=>setConfirm(product)}><Trash2/></button></div></td></tr>)}
  </tbody></table></div></div>
  {!loading&&!error&&pagination.pages>1&&<Pagination page={page} setPage={setPage} total={pagination.pages}/>}
  <Modal open={!!confirm} onClose={()=>{if(!busy)setConfirm(null)}} title={`Delete ${confirm?.name||'product'}?`}><div className="modal-body"><p>This removes this pack from the customer catalogue and deletes unused Cloudinary images. Shared pack images stay safe.</p><div className="row end gap"><Button disabled={!!busy} variant="ghost" onClick={()=>setConfirm(null)}>Cancel</Button><Button disabled={!!busy} variant="danger" onClick={destroy}>{busy?'Deleting…':'Delete product'}</Button></div></div></Modal>
  <Modal open={deleteAllConfirm} onClose={()=>{if(!busy)setDeleteAllConfirm(false)}} title="Delete all products?"><div className="modal-body"><p>Are you sure you want to delete all <b>{totalProducts}</b> products from your store?</p><p className="text-danger">This will remove all products from the customer catalogue. This action cannot be undone.</p><div className="row end gap"><Button disabled={!!busy} variant="ghost" onClick={()=>setDeleteAllConfirm(false)}>Cancel</Button><Button disabled={!!busy} variant="danger" onClick={destroyAll}>{busy==='all'?'Deleting all products…':'Yes, delete all products'}</Button></div></div></Modal>
  <Modal open={!!view} onClose={()=>setView(null)} title={view?.name||'Product details'}><div className="modal-body">{view&&<>{view.image&&<img className="upload-preview" src={view.image} alt={view.name}/>}<p>{view.description}</p><dl><dt>Category</dt><dd>{view.categoryName}</dd><dt>Pack / SKU</dt><dd>{view.unit} · {view.sku}</dd><dt>MRP / selling price</dt><dd>{money(view.mrp)} / {money(view.price)}</dd><dt>Stock / low stock threshold</dt><dd>{view.stock} / {view.lowStockThreshold}</dd><dt>Status</dt><dd>{view.status}</dd></dl><Link className="btn btn-primary" to={`/admin/products/${view.id}/edit`}>Edit this pack</Link></>}</div></Modal>
 </>;
}

function FilterBar({q,setQ,children}){return <div className="filter-bar"><div className="filter-search"><Search/><input value={q} onChange={event=>setQ(event.target.value)} placeholder="Search by name or SKU"/></div>{children}</div>}

export function ProductForm(){
 const {id}=useParams();
 const nav=useNavigate();
 const {notify,refreshProducts}=useApp();
 const {categories,categoryError,reloadCategories}=useAdminCategories();
 const [form,setForm]=useState(emptyProduct);
 const [loading,setLoading]=useState(Boolean(id));
 const [saving,setSaving]=useState(false);
 const [imageFile,setImageFile]=useState(null);
 const [preview,setPreview]=useState('');
 const [packs,setPacks]=useState([]);
 const [loadError,setLoadError]=useState(''),[reload,setReload]=useState(0);
 useEffect(()=>{let active=true;setLoadError('');setImageFile(null);setPreview('');setPacks([]);if(!id){setForm(emptyProduct);setLoading(false);return}setLoading(true);adminService.product(id).then(product=>{if(active)setForm({...emptyProduct,...product})}).catch(reason=>{if(active)setLoadError(reason.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id,reload]);
 useEffect(()=>()=>{if(preview.startsWith('blob:'))URL.revokeObjectURL(preview)},[preview]);
 const set=(key,value)=>setForm(current=>({...current,[key]:value}));
 const field=(key,label,type='text')=><label>{label}<input type={type} required min={type==='number'?0:undefined} step={['mrp','price'].includes(key)?'0.01':undefined} value={form[key]??''} onChange={event=>set(key,event.target.value)}/></label>;
 const chooseImage=event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type))return notify('Choose a JPG, PNG or WebP image','error');if(file.size>5*1024*1024)return notify('Image must be smaller than 5 MB','error');if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);setImageFile(file);setPreview(URL.createObjectURL(file))};
 const save=async event=>{event.preventDefault();setSaving(true);try{if(!form.category)throw new Error('Select a product category');if([form,...packs].some(pack=>Number(pack.price)>Number(pack.mrp)))throw new Error('Selling price cannot exceed MRP for any pack');const units=[form,...packs].map(pack=>pack.unit.trim().toLowerCase().replace(/\s+/g,''));if(new Set(units).size!==units.length)throw new Error('Each pack size must be different');let next=form;if(imageFile){const uploaded=await adminService.uploadProductImage(imageFile,form.category);next={...form,image:uploaded.url}}await(id?adminService.updateProduct(id,payload(next)):adminService.createProduct({...payload(next),packs}));await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(id?'Product updated':'Product and all pack sizes published');nav('/admin/products')}catch(error){notify(error.message,'error')}finally{setSaving(false)}};
 if(loading)return <div className="admin-card modal-body">Loading product…</div>;
 if(loadError)return <div className="admin-card bulk-error"><p role="alert">{loadError}</p><Button variant="outline" onClick={()=>setReload(value=>value+1)}>Try again</Button><Link className="back-link" to="/admin/products">Back to products</Link></div>;
 return <>
  <Link className="back-link" to="/admin/products"><ArrowLeft/> Back to products</Link>
  <AdminTitle title={id?'Edit product':'Add new product'} text="Saved changes are published to the customer catalogue."/>
  {categoryError&&<div className="admin-card bulk-error"><p role="alert">{categoryError}</p><Button variant="outline" onClick={reloadCategories}>Retry categories</Button></div>}
  <form className="admin-form" onSubmit={save}>
   <section className="admin-card"><h3>Product media</h3><div className="upload-box">{(preview||form.image)?<img src={preview||form.image} alt="Product preview" className="upload-preview"/>:<ImagePlus/>}<b>Upload product image</b><span>JPG, PNG or WebP · maximum 5 MB</span><label className="btn btn-outline">Choose from device<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} hidden/></label><span>or paste an image URL</span><input type="url" value={form.image||''} onChange={event=>{set('image',event.target.value);setImageFile(null);setPreview('')}} placeholder="https://example.com/product.jpg"/></div></section>
   <section className="admin-card"><h3>Basic information</h3><div className="form-grid">{field('name','Product name')}<label>Category<select required value={form.category} onChange={event=>set('category',event.target.value)}><option value="">Choose category</option>{categories.filter(category=>category.status!=='INACTIVE').map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label><label>SKU · Automatic<input readOnly value={form.sku||''} placeholder="Generated automatically when you save"/><small className="muted">{id?'This inventory code stays unchanged.':'A unique inventory code will be created by the server.'}</small></label><label className="full">Description<textarea required value={form.description} onChange={event=>set('description',event.target.value)}/></label></div></section>
   <section className="admin-card"><h3>Pricing & inventory</h3><div className="form-grid">{field('unit','Unit')}{field('mrp','MRP','number')}{field('price','Selling price','number')}{field('stock','Stock','number')}<label>Status<select value={form.status} onChange={event=>set('status',event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label><label className="check-line"><input type="checkbox" checked={form.featured} onChange={event=>set('featured',event.target.checked)}/> Featured product</label><label className="check-line"><input type="checkbox" checked={form.bestSeller} onChange={event=>set('bestSeller',event.target.checked)}/> Best seller</label></div></section>
   {id?<ProductVariants key={id} productId={id}/>:<NewProductPacks packs={packs} onChange={setPacks} disabled={saving}/>}
   <section className="admin-card"><h3>Stock alert threshold</h3><label>Notify when stock is at or below<input type="number" min="0" step="1" value={form.lowStockThreshold} placeholder="Use the backend default" onChange={event=>set('lowStockThreshold',event.target.value)}/></label></section>
   <div className="form-actions"><Button type="button" variant="ghost" disabled={saving} onClick={()=>nav('/admin/products')}>Cancel</Button><Button disabled={saving||!!categoryError}>{saving?'Saving…':'Save product'}</Button></div>
  </form>
 </>;
}
