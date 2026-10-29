import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  Clock3,
  Crop, 
  Edit2, 
  ExternalLink, 
  Eye, 
  FolderTree, 
  Package, 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  X 
} from 'lucide-react';
import { Button, Modal, money } from '../ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';
import { ProductDetailModal } from '../../pages/admin/Products';
import { isProductComingSoon } from '../../config/homeLayout';

function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('r2cart-admin-user')) || null;
  } catch {
    return null;
  }
}

export default function CategoryProductsModal({ category, onClose, onRefreshCategories }) {
  const { notify, storeSettings, setStoreSettings } = useApp();
  const currentUser = getAdminUser();
  const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN';
  const basePath = isSuper ? '/super-admin' : '/admin';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, in, low, out
  const [statusFilter, setStatusFilter] = useState('all'); // all, ACTIVE, INACTIVE
  const [inspectProduct, setInspectProduct] = useState(null);
  const [togglingId, setTogglingId] = useState('');
  const [togglingSoonId, setTogglingSoonId] = useState('');
  const [localSoonMap, setLocalSoonMap] = useState({});

  const checkIsSoon = (prod) => {
    if (!prod) return false;
    if (localSoonMap[prod.id] !== undefined) return localSoonMap[prod.id];
    return isProductComingSoon(prod, storeSettings);
  };

  const toggleComingSoon = async (product) => {
    const currentSoon = checkIsSoon(product);
    const nextSoon = !currentSoon;

    // Optimistic UI update in 0ms:
    const packIds = [product.id, ...(product.packs || []).map(p => p.id)];
    const newMap = { ...localSoonMap };
    packIds.forEach(id => { newMap[id] = nextSoon; });
    setLocalSoonMap(newMap);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isSoon: nextSoon } : p));
    setTogglingSoonId(product.id);

    try {
      const res = await adminService.toggleProductComingSoon(product.id, nextSoon);
      notify(`"${product.name}" is now marked as ${res.isSoon ? 'Coming Soon' : 'Available'}`, 'success');
      if (res.policies && setStoreSettings) {
        setStoreSettings(prev => ({ ...prev, policies: res.policies }));
      }
      window.dispatchEvent(new CustomEvent('r2cart:settings-updated', { detail: { policies: res.policies, settings: res.policies } }));
      window.dispatchEvent(new Event('r2cart:products-updated'));
    } catch (err) {
      notify(err.message || 'Failed to update Coming Soon status', 'error');
      const reverted = { ...localSoonMap };
      packIds.forEach(id => { reverted[id] = currentSoon; });
      setLocalSoonMap(reverted);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isSoon: currentSoon } : p));
    } finally {
      setTogglingSoonId('');
    }
  };

  const loadProducts = async () => {
    if (!category?.slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminService.productsPage({
        category: category.slug,
        limit: 100
      });
      setProducts(res.products || []);
    } catch (err) {
      setError(err.message || 'Failed to load products for this category');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      setSearchQ('');
      setStockFilter('all');
      setStatusFilter('all');
      loadProducts();
    }
  }, [category]);

  const toggleStatus = async (product) => {
    setTogglingId(product.id);
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateProductStatus(product.id, nextStatus);
      setProducts(curr => curr.map(p => p.id === product.id ? { ...p, status: nextStatus } : p));
      notify(`"${product.name}" is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}`, 'success');
      window.dispatchEvent(new Event('r2cart:products-updated'));
    } catch (err) {
      notify(err.message || 'Failed to update product status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchQ) {
        const q = searchQ.trim().toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      if (stockFilter === 'in') {
        if (p.stock <= (p.lowStockThreshold || 5)) return false;
      } else if (stockFilter === 'low') {
        if (p.stock <= 0 || p.stock > (p.lowStockThreshold || 5)) return false;
      } else if (stockFilter === 'out') {
        if (p.stock > 0) return false;
      }

      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [products, searchQ, stockFilter, statusFilter]);

  const inStockCount = useMemo(() => products.filter(p => p.stock > (p.lowStockThreshold || 5)).length, [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stock <= 0).length, [products]);

  if (!category) return null;

  return (
    <>
      <Modal open={!!category} onClose={onClose} size="category-products-modal">
        {/* Modal Header */}
        <div className="cat-modal-header">
          <div className="cat-modal-title-wrap">
            <div 
              className="cat-modal-avatar"
              style={{ background: category.color || '#EAF8E8' }}
            >
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name} 
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <FolderTree size={22} color="#059669" />
              )}
            </div>
            <div>
              <div className="cat-modal-name-row">
                <h2>{category.name}</h2>
                <span className="cat-product-count-pill">
                  {products.length} {products.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>
              <p className="cat-modal-sub">
                Browse and manage all catalogue products for <b>{category.name}</b> in card view.
              </p>
            </div>
          </div>

          <div className="cat-modal-head-actions">
            <Link 
              to={`${basePath}/products/new?category=${category.slug}`}
              className="btn btn-primary cat-action-btn"
              onClick={onClose}
              title="Add a new product to this category"
            >
              <Plus size={15} /> Add product
            </Link>
            <Link 
              to={`${basePath}/products?cat=${category.slug}`}
              className="btn btn-outline cat-action-btn"
              onClick={onClose}
              title="View in full products table"
            >
              <ExternalLink size={14} /> Full table
            </Link>
            <button 
              type="button" 
              className="icon-btn cat-close-btn" 
              onClick={onClose} 
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Filter Toolbar */}
        <div className="cat-modal-toolbar">
          <div className="cat-modal-search">
            <Search size={16} />
            <input 
              type="text" 
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={`Search products in ${category.name}...`}
            />
            {searchQ && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchQ('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Stock Filter Pills */}
          <div className="cat-filter-chips">
            <button 
              type="button"
              className={`cat-chip ${stockFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              All ({products.length})
            </button>
            <button 
              type="button"
              className={`cat-chip green ${stockFilter === 'in' ? 'active' : ''}`}
              onClick={() => setStockFilter('in')}
            >
              In stock ({inStockCount})
            </button>
            <button 
              type="button"
              className={`cat-chip amber ${stockFilter === 'low' ? 'active' : ''}`}
              onClick={() => setStockFilter('low')}
            >
              Low stock ({lowStockCount})
            </button>
            <button 
              type="button"
              className={`cat-chip red ${stockFilter === 'out' ? 'active' : ''}`}
              onClick={() => setStockFilter('out')}
            >
              Out of stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Modal Body / Cards Grid */}
        <div className="cat-modal-body">
          {loading ? (
            <div className="cat-cards-skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cat-card-skeleton">
                  <div className="skeleton-img" />
                  <div className="skeleton-line" style={{ width: '80%' }} />
                  <div className="skeleton-line" style={{ width: '50%' }} />
                  <div className="skeleton-line" style={{ width: '40%', marginTop: 'auto' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="cat-cards-error">
              <p>{error}</p>
              <Button variant="outline" onClick={loadProducts}>Try again</Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="cat-cards-empty">
              <div className="empty-box-icon">
                <Package size={48} />
              </div>
              <h3>
                {searchQ || stockFilter !== 'all' ? 'No matching products found' : `No products in ${category.name}`}
              </h3>
              <p>
                {searchQ || stockFilter !== 'all' 
                  ? 'Try adjusting your search query or stock filter chips.' 
                  : 'Start adding items to this category so they appear here in card view and on your customer storefront.'}
              </p>
              <Link 
                to={`${basePath}/products/new?category=${category.slug}`}
                className="btn btn-primary"
                onClick={onClose}
                style={{ marginTop: '12px' }}
              >
                <Plus size={16} /> Add first product
              </Link>
            </div>
          ) : (
            <div className="cat-products-card-grid">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);
                const hasDiscount = Number(product.mrp) > Number(product.price);
                const discountPct = hasDiscount 
                  ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) 
                  : 0;

                return (
                  <div 
                    key={product.id} 
                    className="product-card-shape"
                  >
                    {/* Media Area */}
                    <div className="card-shape-media">
                      {BooleancheckIsSoon(product) && (
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#d97706', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <Clock3 size={10} /> SOON
                        </span>
                      )}
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          loading="lazy"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Package size={44} color="#94a3b8" />
                      )}

                      {/* Discount Pill */}
                      {hasDiscount && (
                        <span className="card-discount-pill">
                          {discountPct}% OFF
                        </span>
                      )}

                      {/* Stock Pill */}
                      <span className={`card-stock-pill ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                        {isOutOfStock ? '0 left' : isLowStock ? `${product.stock} Low` : `${product.stock} in stock`}
                      </span>

                      {/* Active Status Badge */}
                      <span className={`card-status-pill ${product.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {product.status === 'ACTIVE' ? '● Active' : '○ Inactive'}
                      </span>
                    </div>

                    {/* Copy Area */}
                    <div className="card-shape-content">
                      <div className="card-meta-row">
                        <span className="card-sku-code" title={product.sku}>{product.sku || 'No SKU'}</span>
                        <span className="card-unit-badge">{product.unit || 'Pack'}</span>
                      </div>

                      <h4 className="card-product-title" title={product.name}>
                        {product.name}
                      </h4>

                      {/* Price Row */}
                      <div className="card-price-row">
                        <strong className="card-selling-price">{money(product.price)}</strong>
                        {hasDiscount && (
                          <del className="card-mrp-price">{money(product.mrp)}</del>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="card-action-bar">
                        <button
                          type="button"
                          className="card-detail-btn"
                          onClick={() => setInspectProduct(product)}
                          title="View product details"
                        >
                          <Eye size={14} /> Details
                        </button>

                        <button
                          type="button"
                          disabled={togglingSoonId === product.id}
                          onClick={() => toggleComingSoon(product)}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: checkIsSoon(product) ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                            background: checkIsSoon(product) ? '#fef3c7' : '#ffffff',
                            color: checkIsSoon(product) ? '#b45309' : '#64748b',
                            cursor: 'pointer',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={checkIsSoon(product) ? "Marked as Coming Soon (Click to make Available)" : "Marked as Available (Click to mark Coming Soon)"}
                        >
                          <Clock3 size={11} />
                          {checkIsSoon(product) ? 'Soon: ON' : 'Soon: OFF'}
                        </button>

                        <Link
                          to={`${basePath}/products/${product.id}/edit`}
                          className="card-icon-action-btn"
                          onClick={onClose}
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </Link>

                        <button
                          type="button"
                          disabled={togglingId === product.id}
                          className={`card-icon-action-btn ${product.status === 'ACTIVE' ? 'active-toggle' : 'inactive-toggle'}`}
                          onClick={() => toggleStatus(product)}
                          title={product.status === 'ACTIVE' ? 'Hide from storefront' : 'Make visible in storefront'}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Product Detail Inspector Modal */}
      {inspectProduct && (
        <ProductDetailModal 
          view={inspectProduct} 
          onClose={() => setInspectProduct(null)} 
          basePath={basePath} 
        />
      )}
    </>
  );
}
