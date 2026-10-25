import {AlertCircle,AlertTriangle,ArrowRight,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,Heart,Minus,PackageOpen,Plus,Search,SearchX,ShoppingBag,Sparkles,Trash2,X,Zap} from 'lucide-react';
import {Link} from 'react-router-dom'; import {useApp} from '../context/AppContext'; import {useLanguage} from '../context/LanguageContext';
import {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {packOptions} from '../utils/products';
export const money=n=>`₹${Number(n).toLocaleString('en-IN')}`;
export function Button({children,variant='primary',className='',...p}){return <button className={`btn btn-${variant} ${className}`} {...p}>{children}</button>}
export function Badge({children,tone='green'}){return <span className={`badge badge-${tone}`}>{children}</span>}
export function Modal({open,onClose,title,children,size=''}){
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if(!open)return null;
  const labelText = typeof title === 'string' ? title : 'Modal dialog';
  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-label={labelText} onMouseDown={e=>e.stopPropagation()}>
        {title&&<div className="modal-head"><h3>{title}</h3><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={20}/></button></div>}
        {children}
      </div>
    </div>,
    document.body
  )
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  warningNote = '',
  itemName = '',
  itemType = '',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger'
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;
  const isDanger = variant === 'danger';

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) {
          setError('');
          onClose();
        }
      }}
      size="confirm-modal"
    >
      <div className="confirm-dialog-wrap">
        <button
          type="button"
          className="confirm-dialog-close"
          onClick={() => {
            if (!busy) {
              setError('');
              onClose();
            }
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="confirm-dialog-top">
          <div className={`confirm-dialog-icon ${variant}`}>
            {isDanger ? <Trash2 size={22} strokeWidth={2.2} /> : <AlertTriangle size={22} strokeWidth={2.2} />}
          </div>
          <div className="confirm-dialog-titles">
            <h3 className="confirm-dialog-heading">{title}</h3>
            {itemName && (
              <span className={`confirm-dialog-pill ${variant}`}>
                {itemType ? `${itemType}: ` : ''}{itemName}
              </span>
            )}
          </div>
        </div>

        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>

          {warningNote && (
            <div className={`confirm-dialog-notice ${variant}`}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{warningNote}</span>
            </div>
          )}

          {error && (
            <div className="confirm-dialog-error" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="confirm-dialog-actions">
          <Button
            type="button"
            disabled={busy}
            variant="ghost"
            className="confirm-cancel-btn"
            onClick={() => {
              setError('');
              onClose();
            }}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={busy}
            variant={isDanger ? 'danger' : 'primary'}
            className="confirm-submit-btn"
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const result = await onConfirm();
                if (result !== false) onClose();
              } catch (reason) {
                setError(reason.message || 'Operation failed. Please try again.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="confirm-loader-spin" />
                <span>Processing…</span>
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export function EmptyState({icon='cart',title,text,action,to='/'}){const Icon=icon==='package'?PackageOpen:icon==='search'?SearchX:icon==='heart'?Heart:ShoppingBag;return <div className="empty empty-state-card"><div className="empty-state-badge"><Icon size={34} strokeWidth={2}/></div><h2 className="empty-state-title">{title}</h2>{text&&<p className="empty-state-text">{text}</p>}{action&&<Link className="empty-state-btn" to={to}><span>{action}</span><ArrowRight size={16} strokeWidth={2.4}/></Link>}</div>}
export function QuantitySelector({id,small=false,choosePacks=small,product:propProduct}){
 const {cart,add,qty,products}=useApp();const {t,tProd}=useLanguage();const [open,setOpen]=useState(false);
 const product=propProduct||products.find(item=>item.id===id);const n=cart[id]||0;
 const options=product?packOptions(product,products):[];
 const unavailable=!product||product.stock<=0||product.status==='INACTIVE';const maximum=Math.min(99,Number(product?.stock||0));
 const canChoose=choosePacks&&options.length>1;
 const formatStock = (count) => {
  if (count <= 0) return t('outOfStock');
  if (count <= 5) return t('onlyLeft').replace('{count}', count);
  return `${count} ${t('inStock')}`;
 };
 return <>{n?<div className={`qty ${small?'small':''}`}><button type="button" onClick={()=>qty(id,n-1)} aria-label="Decrease"><Minus size={15}/></button><b>{n}</b><button type="button" disabled={unavailable||n>=maximum} onClick={()=>qty(id,n+1)} aria-label="Increase"><Plus size={15}/></button></div>:unavailable&&!canChoose?<button type="button" disabled className={`btn-out-of-stock ${small?'small':''}`} title={t('outOfStock')||'Out of stock'} aria-label={t('outOfStock')||'Out of stock'}>{t('outOfStock')||'Out of stock'}</button>:<Button type="button" disabled={canChoose?options.every(pack=>pack.stock<=0):unavailable} className={small?'small-add':''} variant="outline" onClick={()=>canChoose?setOpen(true):add(id)}>{canChoose&&options.every(pack=>pack.stock<=0)?(t('outOfStock')||'Unavailable'):<>{t('add', 'ADD')} <Plus size={15}/></>}</Button>}<Modal open={open} onClose={()=>setOpen(false)} title={t('choosePackSizes', 'Choose pack sizes')} size="pack-choice-modal"><div className="modal-body"><p className="muted">{tProd(product?.name)} · {t('choosePackDesc', 'Add either size, or both.')}</p><div className="pack-choice-list">{options.map(pack=><div className="pack-choice-row" key={pack.id}><div className="pack-choice-copy"><b>{pack.unit}</b><div><strong>{money(pack.price)}</strong>{pack.mrp>pack.price&&<del>{money(pack.mrp)}</del>}</div><small className={pack.stock>0?(pack.stock<=5?'cart-stock-low':'muted'):'cart-stock-warning'}>{formatStock(pack.stock)}</small></div><QuantitySelector id={pack.id} choosePacks={false} product={pack}/></div>)}</div><Button type="button" className="pack-choice-done" onClick={()=>setOpen(false)}>{t('done', 'Done')}</Button></div></Modal></>;
}
function BaseProductCard({product,packSelector}){
 const {favorites,toggleFavorite,activeDeliveryRules,deliveryConfig}=useApp();
 const {t,tEta,tProd}=useLanguage();
 const eta=(activeDeliveryRules||deliveryConfig)?.estimatedDelivery;
 const off=Math.round((1-product.price/product.mrp)*100);
 const gallery=(product.images&&product.images.length>0)?product.images:(product.image?[product.image]:[]);
 const [imgIdx,setImgIdx]=useState(0);
 const [touchStartX,setTouchStartX]=useState(null);

 useEffect(()=>{setImgIdx(0);},[product.id]);

 const nextImg=(e)=>{
   if(e){e.preventDefault();e.stopPropagation();}
   setImgIdx(prev=>(prev+1)%gallery.length);
 };

 const prevImg=(e)=>{
   if(e){e.preventDefault();e.stopPropagation();}
   setImgIdx(prev=>(prev-1+gallery.length)%gallery.length);
 };

 const onCardTouchStart = (e) => {
   if (gallery.length <= 1) return;
   setTouchStartX(e.touches[0].clientX);
 };

 const onCardTouchEnd = (e) => {
   if (touchStartX === null || gallery.length <= 1) return;
   const deltaX = touchStartX - e.changedTouches[0].clientX;
   if (deltaX > 25) {
     nextImg();
   } else if (deltaX < -25) {
     prevImg();
   }
   setTouchStartX(null);
 };

 const formatStock = (count, threshold = 5) => {
  if (count <= 0) return t('outOfStock');
  if (count <= threshold) return t('onlyLeft').replace('{count}', count);
  return `${count} ${t('inStock')}`;
 };
 const fallback=e=>{e.currentTarget.onerror=null;e.currentTarget.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22240%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23E6FBF3%22/%3E%3Cpath d=%22M160 178c-43-31-48-86 0-116 48 30 43 85 0 116Z%22 fill=%22%2310B981%22/%3E%3Cpath d=%22M160 178c0-48 16-77 39-98%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%228%22 stroke-linecap=%22round%22/%3E%3C/svg%3E'};

 return <article className="product-card">
  <div
    className="product-media"
    style={{position:'relative',overflow:'hidden'}}
    onTouchStart={onCardTouchStart}
    onTouchEnd={onCardTouchEnd}
  >
    {off>0&&<span className="discount">{off}% {t('off', 'OFF')}</span>}
    <button className={`heart ${favorites.includes(product.id)?'active':''}`} onClick={()=>toggleFavorite(product.id)} aria-label="Favourite"><Heart size={18} fill={favorites.includes(product.id)?'currentColor':'none'}/></button>
    <Link to={`/product/${product.id}`} style={{display:'block',width:'100%',height:'100%'}}>
      <img src={gallery[imgIdx]||product.image} alt={tProd(product.name)} loading="lazy" decoding="async" onError={fallback}/>
    </Link>
    {gallery.length>1&&(
      <>
        <button
          type="button"
          onClick={prevImg}
          aria-label="Previous image"
          className="card-gallery-arrow prev"
          style={{
            position:'absolute',
            left:'4px',
            top:'50%',
            transform:'translateY(-50%)',
            width:'24px',
            height:'24px',
            borderRadius:'50%',
            background:'rgba(255,255,255,0.92)',
            border:'1px solid #e2e8f0',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            boxShadow:'0 2px 6px rgba(0,0,0,0.12)',
            cursor:'pointer',
            zIndex:3,
            padding:0
          }}
        >
          <ChevronLeft size={14} color="#0f172a"/>
        </button>
        <button
          type="button"
          onClick={nextImg}
          aria-label="Next image"
          className="card-gallery-arrow next"
          style={{
            position:'absolute',
            right:'4px',
            top:'50%',
            transform:'translateY(-50%)',
            width:'24px',
            height:'24px',
            borderRadius:'50%',
            background:'rgba(255,255,255,0.92)',
            border:'1px solid #e2e8f0',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            boxShadow:'0 2px 6px rgba(0,0,0,0.12)',
            cursor:'pointer',
            zIndex:3,
            padding:0
          }}
        >
          <ChevronRight size={14} color="#0f172a"/>
        </button>
        <div style={{position:'absolute',bottom:'4px',left:0,right:0,display:'flex',justifyContent:'center',gap:'3px',zIndex:3,pointerEvents:'none'}}>
          {gallery.map((_,dotIdx)=>(
            <span key={dotIdx} style={{width:dotIdx===imgIdx?'10px':'4px',height:'4px',borderRadius:'4px',background:dotIdx===imgIdx?'#059669':'rgba(15,23,42,0.25)',transition:'all 0.2s ease'}}/>
          ))}
        </div>
      </>
    )}
  </div>
  <div className="product-copy">
    <span className="delivery-pill"><Zap/> {tEta(eta)}</span>
    <Link to={`/product/${product.id}`} className="product-name">{tProd(product.name)}</Link>
    {packSelector||(
      <div className="product-meta-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%', overflow: 'hidden', minHeight: '18px' }}>
        <span
          className="unit"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto', minWidth: 0 }}
          title={product.unit}
        >
          {product.unit}
        </span>
        {product.stock > 0 ? (
          <span className={`stock-tag ${product.stock <= (product.lowStockThreshold || 5) ? 'low' : ''}`} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            {formatStock(product.stock, product.lowStockThreshold || 5)}
          </span>
        ) : (
          <span className="stock-tag out" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            {t('outOfStock')}
          </span>
        )}
      </div>
    )}
    <div className="product-foot">
      <div><strong>{money(product.price)}</strong>{product.mrp>product.price&&<del>{money(product.mrp)}</del>}</div>
      <QuantitySelector id={product.id} small product={product}/>
    </div>
  </div>
 </article>;
}

export function ProductCard({product}){
 return <BaseProductCard product={product}/>;
}
export function ProductGrid({items}){return <div className="product-grid">{items.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
export function ProductRail({title,subtitle,items,to,comingSoon,comingSoonBadge,comingSoonNotice}){
 const {t}=useLanguage();
 const id=title.replaceAll(' ','-');
 const scroll=n=>document.getElementById(id)?.scrollBy({left:n,behavior:'smooth'});
 return <section className="section"><div className="section-head"><div><h2>{title}{comingSoon&&<span className="section-coming-soon-badge"><Sparkles size={12}/> {comingSoonBadge||'Coming Soon'}</span>}</h2><p>{subtitle||'Handpicked quality, delivered quickly'}</p></div><div className="rail-actions">{!comingSoon&&<Link to={to||'/search'}>{t('seeAll', 'See all')}</Link>}{!comingSoon&&<button type="button" aria-label="Scroll left" onClick={()=>scroll(-500)}><ChevronLeft/></button>}{!comingSoon&&<button type="button" aria-label="Scroll right" onClick={()=>scroll(500)}><ChevronRight/></button>}</div></div>{comingSoon?<div className="section-cs-banner"><span className="cs-chip"><Sparkles size={12}/> COMING SOON</span><h4>Section Opening Soon for Customers</h4><p>{comingSoonNotice||`We are stocking up the freshest products for "${title}". Check back shortly!`}</p></div>:<div className="product-rail" id={id}>{items.map(p=><ProductCard key={p.id} product={p}/>)}</div>}</section>;
}
export function SearchInput({value,onChange,onSubmit,onFocus,onBlur,placeholder='Search for milk, fruits, snacks…'}){return <form className="search-box" onSubmit={e=>{e.preventDefault();onSubmit?.()}}><Search size={20}/><input value={value} onChange={e=>onChange?.(e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}/>{value&&<button type="button" onClick={()=>onChange('')}><X size={17}/></button>}</form>}
export function StatusBadge({status}){const s=String(status||'').toLowerCase();const tone=['delivered','active','resolved','confirmed','open'].includes(s)?'green':['cancelled','out of stock','expired','inactive','closed','disabled'].includes(s)?'red':['out for delivery','in transit','shipped'].includes(s)?'blue':'amber';return <Badge tone={tone}>{status}</Badge>}
export function Pagination({page,setPage,total=1}){const pages=[...new Set([1,...Array.from({length:5},(_,i)=>page-2+i).filter(value=>value>0&&value<=total),total])].sort((a,b)=>a-b);return <nav className="pagination" aria-label="Pagination"><button type="button" aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronLeft/></button>{pages.map((value,index)=><span className="pagination-part" key={value}>{index>0&&value>pages[index-1]+1&&<span aria-hidden="true">…</span>}<button type="button" className={page===value?'active':''} aria-current={page===value?'page':undefined} onClick={()=>setPage(value)}>{value}</button></span>)}<button type="button" aria-label="Next page" disabled={page>=total} onClick={()=>setPage(page+1)}><ChevronRight/></button></nav>}
export function Skeletons({count=8}={}){return <div className="product-grid">{Array.from({length:count}).map((_,x)=><div className="skeleton-card" key={x}><div className="skeleton-thumb r2c-skeleton-box"/><div className="skeleton-eta r2c-skeleton-box"/><div className="skeleton-title r2c-skeleton-box"/><div className="skeleton-sub r2c-skeleton-box"/><div className="skeleton-bottom"><div className="skeleton-price r2c-skeleton-box"/><div className="skeleton-btn r2c-skeleton-box"/></div></div>)}</div>}
