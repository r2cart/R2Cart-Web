import {useEffect,useMemo,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,Edit2,Eye,ImagePlus,Plus,Search,Trash2} from 'lucide-react';
import {Button,ConfirmDialog,StatusBadge,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const emptyProduct={name:'',category:'',unit:'',mrp:'',price:'',stock:'',sku:'',description:'',image:'',status:'ACTIVE',featured:false,bestSeller:false};
const payload=product=>({name:product.name,category:product.category,unit:product.unit,mrp:Number(product.mrp),price:Number(product.price),stock:Number(product.stock),sku:product.sku,description:product.description,image:product.image||'',status:product.status==='Active'?'ACTIVE':product.status,featured:Boolean(product.featured),bestSeller:Boolean(product.bestSeller)});

export function AdminProducts(){
 const {notify,categories,refreshProducts}=useApp();
 const [q,setQ]=useState('');
 const [cat,setCat]=useState('all');
 const [stock,setStock]=useState('all');
 const [status,setStatus]=useState('all');
 const [list,setList]=useState([]);
 const [loading,setLoading]=useState(true);
 const [confirm,setConfirm]=useState(null);

 const load=async()=>{setLoading(true);try{setList(await adminService.products())}catch(error){notify(error.message,'error')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const shown=useMemo(()=>list.filter(product=>product.name.toLowerCase().includes(q.toLowerCase())&&(cat==='all'||product.category===cat)&&(stock==='all'||stock==='low'&&product.stock>0&&product.stock<=10||stock==='out'&&product.stock===0)&&(status==='all'||product.status===status)),[list,q,cat,stock,status]);

 const toggle=async product=>{try{const next=product.status==='ACTIVE'?'INACTIVE':'ACTIVE';const updated=await adminService.updateProductStatus(product.id,next);setList(items=>items.map(item=>item.id===product.id?updated:item));await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(next==='ACTIVE'?'Product activated':'Product deactivated')}catch(error){notify(error.message,'error')}};
 const destroy=async()=>{const product=confirm;if(!product)return;try{await adminService.deleteProduct(product.id);setList(items=>items.filter(item=>item.id!==product.id));await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify('Product deleted')}catch(error){notify(error.message,'error')}};

 return <>
  <AdminTitle title="Products" text={`${list.length} products across ${categories.length} categories`} action={<Link className="btn btn-primary" to="/admin/products/new"><Plus/> Add product</Link>}/>
  <FilterBar q={q} setQ={setQ}>
   <select value={cat} onChange={event=>setCat(event.target.value)}><option value="all">All categories</option>{categories.map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select>
   <select value={stock} onChange={event=>setStock(event.target.value)}><option value="all">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
   <select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
  </FilterBar>
  <div className="admin-card table-card"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>MRP</th><th>Selling price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
   {loading?<tr><td colSpan="8">Loading products…</td></tr>:shown.map(product=><tr key={product.id}><td><div className="product-cell"><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.sku}</small></span></div></td><td>{categories.find(category=>category.slug===product.category)?.name||product.category}</td><td>{product.unit}</td><td>{money(product.mrp)}</td><td><b>{money(product.price)}</b></td><td><span className={product.stock<10?'text-danger':''}>{product.stock}</span></td><td><button onClick={()=>toggle(product)} aria-label="Toggle product status"><StatusBadge status={product.status==='ACTIVE'?'Active':'Inactive'}/></button></td><td><div className="table-actions"><Link to={`/product/${product.id}`}><Eye/></Link><Link to={`/admin/products/${product.id}/edit`}><Edit2/></Link><button onClick={()=>setConfirm(product)}><Trash2/></button></div></td></tr>)}
  </tbody></table></div></div>
  <ConfirmDialog open={!!confirm} onClose={()=>setConfirm(null)} title={`Delete ${confirm?.name||'product'}?`} message="This removes the product from the customer catalogue." onConfirm={destroy}/>
 </>;
}

function FilterBar({q,setQ,children}){return <div className="filter-bar"><div className="filter-search"><Search/><input value={q} onChange={event=>setQ(event.target.value)} placeholder="Search by name or SKU"/></div>{children}</div>}

export function ProductForm(){
 const {id}=useParams();
 const nav=useNavigate();
 const {notify,categories,refreshProducts}=useApp();
 const [form,setForm]=useState(emptyProduct);
 const [loading,setLoading]=useState(Boolean(id));
 const [saving,setSaving]=useState(false);
 const [imageFile,setImageFile]=useState(null);
 const [preview,setPreview]=useState('');
 useEffect(()=>{if(!id)return;adminService.products().then(rows=>{const product=rows.find(item=>item.id===id);if(!product)throw new Error('Product not found');setForm({...emptyProduct,...product,status:product.status||'ACTIVE'})}).catch(error=>{notify(error.message,'error');nav('/admin/products')}).finally(()=>setLoading(false))},[id]);
 const set=(key,value)=>setForm(current=>({...current,[key]:value}));
 const field=(key,label,type='text')=><label>{label}<input type={type} required min={type==='number'?0:undefined} step={['mrp','price'].includes(key)?'0.01':undefined} value={form[key]??''} onChange={event=>set(key,event.target.value)}/></label>;
 const chooseImage=event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type))return notify('Choose a JPG, PNG or WebP image','error');if(file.size>5*1024*1024)return notify('Image must be smaller than 5 MB','error');if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);setImageFile(file);setPreview(URL.createObjectURL(file))};
 const save=async event=>{event.preventDefault();setSaving(true);try{if(Number(form.price)>Number(form.mrp))throw new Error('Selling price cannot exceed MRP');let next=form;if(imageFile){const uploaded=await adminService.uploadProductImage(imageFile);next={...form,image:uploaded.url}}await(id?adminService.updateProduct(id,payload(next)):adminService.createProduct(payload(next)));await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify(id?'Product updated':'Product created');nav('/admin/products')}catch(error){notify(error.message,'error')}finally{setSaving(false)}};
 if(loading)return <div className="admin-card modal-body">Loading product…</div>;
 return <>
  <Link className="back-link" to="/admin/products"><ArrowLeft/> Back to products</Link>
  <AdminTitle title={id?'Edit product':'Add new product'} text="Saved changes are published to the customer catalogue."/>
  <form className="admin-form" onSubmit={save}>
   <section className="admin-card"><h3>Product media</h3><div className="upload-box">{(preview||form.image)?<img src={preview||form.image} alt="Product preview" className="upload-preview"/>:<ImagePlus/>}<b>Upload product image</b><span>JPG, PNG or WebP · maximum 5 MB</span><label className="btn btn-outline">Choose from device<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} hidden/></label><span>or paste an image URL</span><input type="url" value={form.image||''} onChange={event=>{set('image',event.target.value);setImageFile(null);setPreview('')}} placeholder="https://example.com/product.jpg"/></div></section>
   <section className="admin-card"><h3>Basic information</h3><div className="form-grid">{field('name','Product name')}<label>Category<select required value={form.category} onChange={event=>set('category',event.target.value)}><option value="">Choose category</option>{categories.filter(category=>category.status!=='INACTIVE').map(category=><option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>{field('sku','SKU')}<label className="full">Description<textarea required value={form.description} onChange={event=>set('description',event.target.value)}/></label></div></section>
   <section className="admin-card"><h3>Pricing & inventory</h3><div className="form-grid">{field('unit','Unit')}{field('mrp','MRP','number')}{field('price','Selling price','number')}{field('stock','Stock','number')}<label>Status<select value={form.status} onChange={event=>set('status',event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label><label className="check-line"><input type="checkbox" checked={form.featured} onChange={event=>set('featured',event.target.checked)}/> Featured product</label><label className="check-line"><input type="checkbox" checked={form.bestSeller} onChange={event=>set('bestSeller',event.target.checked)}/> Best seller</label></div></section>
   <div className="form-actions"><Button type="button" variant="ghost" disabled={saving} onClick={()=>nav('/admin/products')}>Cancel</Button><Button disabled={saving}>{saving?'Saving…':'Save product'}</Button></div>
  </form>
 </>;
}
