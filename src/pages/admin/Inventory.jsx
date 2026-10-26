import {useEffect,useState} from 'react';
import {AlertCircle,AlertTriangle,ArrowDownRight,ArrowUpRight,Boxes,Calendar,CheckCircle2,Download,Edit2,FileSpreadsheet,History,LoaderCircle,PackageCheck,RefreshCcw,Save,Search,SlidersHorizontal,ToggleLeft,ToggleRight} from 'lucide-react';
import {Button,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

let cachedInventoryItems = null;
let cachedInventoryStats = null;
let cachedInventoryPagination = null;
let lastInventoryFetch = 0;

export function AdminInventory() {
  const { notify, refreshProducts } = useApp();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'logs'

  // Stock overview data
  const [items, setItems] = useState(() => cachedInventoryItems || []);
  const [stats, setStats] = useState(() => cachedInventoryStats || null);
  const [pagination, setPagination] = useState(() => cachedInventoryPagination || { page: 1, limit: 50, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(() => !cachedInventoryItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Stock adjustment modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentTargetStock, setAdjustmentTargetStock] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Expiry tracking modal state
  const [expiryProduct, setExpiryProduct] = useState(null);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  // Movement logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [logTypeFilter, setLogTypeFilter] = useState('');

  const loadOverview = async (page = 1, silent = false) => {
    if (!silent && !cachedInventoryItems) setLoading(true);
    setError('');
    try {
      const res = await adminService.inventoryOverview({
        page,
        limit: 50,
        status: statusFilter !== 'ALL' ? statusFilter : '',
        search: searchQuery
      });
      cachedInventoryItems = res.items || [];
      cachedInventoryStats = res.stats || null;
      cachedInventoryPagination = res.pagination || { page: 1, limit: 50, total: 0, pages: 1 };
      lastInventoryFetch = Date.now();
      setItems(cachedInventoryItems);
      setStats(cachedInventoryStats);
      setPagination(cachedInventoryPagination);
    } catch (err) {
      if (!cachedInventoryItems) {
        setError(err.message || 'Failed to load inventory');
        notify(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await adminService.getInventoryLogs({
        page,
        limit: 50,
        type: logTypeFilter
      });
      setLogs(res.logs || []);
      setLogsPagination(res.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock') {
      if (cachedInventoryItems && statusFilter === 'ALL' && !searchQuery) {
        setLoading(false);
        if (Date.now() - lastInventoryFetch > 60000) {
          loadOverview(1, true);
        }
      } else {
        loadOverview(1, false);
      }
    } else {
      loadLogs(1);
    }
  }, [activeTab, statusFilter, logTypeFilter]);

  // Handle stock adjustment with mandatory reason
  const handleSaveAdjustment = async e => {
    e.preventDefault();
    if (!selectedProduct) return;

    const trimmedReason = adjustmentReason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      return notify('Please enter a clear mandatory reason for this stock adjustment (min 3 chars)', 'error');
    }

    const target = Number(adjustmentTargetStock);
    if (!Number.isInteger(target) || target < 0) {
      return notify('Stock quantity must be a non-negative whole number', 'error');
    }

    setBusy(true);
    try {
      await adminService.adjustStock({
        productId: selectedProduct.id,
        newStock: target,
        reason: trimmedReason
      });

      notify(`Stock for ${selectedProduct.name} updated to ${target}`);
      setSelectedProduct(null);
      setAdjustmentReason('');
      await loadOverview(pagination.page);
      await refreshProducts();
      window.dispatchEvent(new Event('grocify:products-updated'));
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Handle updating product expiry tracking
  const handleSaveExpiry = async e => {
    e.preventDefault();
    if (!expiryProduct) return;

    if (hasExpiry && !expiryDate) {
      return notify('Please select an expiry date when expiry tracking is active', 'error');
    }

    setBusy(true);
    try {
      await adminService.updateExpiry({
        productId: expiryProduct.id,
        hasExpiry,
        expiryDate: hasExpiry ? expiryDate : null,
        batchNumber: hasExpiry ? batchNumber : null
      });

      notify('Product expiry information updated');
      setExpiryProduct(null);
      await loadOverview(pagination.page);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Toggle automatic hiding of out of stock items
  const handleToggleAutoHide = async () => {
    if (!stats) return;
    try {
      const nextVal = !stats.autoHideOutOfStock;
      await adminService.toggleAutoHideOOS(nextVal);
      setStats(curr => ({ ...curr, autoHideOutOfStock: nextVal }));
      notify(nextVal ? 'Automatic hiding of out-of-stock items enabled' : 'Automatic hiding of out-of-stock items disabled');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const token = localStorage.getItem('grocify-admin-access-token');
    const url = `/api/v1/admin/inventory/export`;
    // Trigger download with auth header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `r2cart-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        notify('Inventory report downloaded');
      })
      .catch(err => notify('Failed to export inventory report: ' + err.message, 'error'));
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Smart Inventory Management</h1>
          <p>Real-time stock monitoring, threshold alerts, product expiry tracking, and concurrency-safe audit logs.</p>
        </div>
        <div className="row gap">
          <Button variant="ghost" onClick={() => activeTab === 'stock' ? loadOverview(pagination.page) : loadLogs(logsPagination.page)}>
            <RefreshCcw /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="delivery-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="admin-card delivery-stat">
            <i><Boxes /></i>
            <span>
              <small>Total Products</small>
              <b>{stats.totalProducts}</b>
            </span>
          </div>
          <div className="admin-card delivery-stat" style={{ borderLeft: '4px solid #10b981' }}>
            <i style={{ color: '#10b981' }}><CheckCircle2 /></i>
            <span>
              <small>Healthy Stock</small>
              <b style={{ color: '#047857' }}>{stats.inStock}</b>
            </span>
          </div>
          <div className="admin-card delivery-stat" style={{ borderLeft: '4px solid #f59e0b' }}>
            <i style={{ color: '#f59e0b' }}><AlertTriangle /></i>
            <span>
              <small>Low Stock Alerts</small>
              <b style={{ color: '#b45309' }}>{stats.lowStock}</b>
            </span>
          </div>
          <div className="admin-card delivery-stat" style={{ borderLeft: '4px solid #ef4444' }}>
            <i style={{ color: '#ef4444' }}><AlertCircle /></i>
            <span>
              <small>Out of Stock</small>
              <b style={{ color: '#b91c1c' }}>{stats.outOfStock}</b>
            </span>
          </div>
          <div className="admin-card delivery-stat" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <i style={{ color: '#8b5cf6' }}><Calendar /></i>
            <span>
              <small>Expiring / Expired</small>
              <b>{stats.expired} <small style={{ fontWeight: 'normal', color: '#6b7280' }}>({stats.approachingExpiry} soon)</small></b>
            </span>
          </div>
        </div>
      )}

      {/* Auto-Hide Out of Stock Toggle Banner */}
      {stats && (
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', marginBottom: '20px', background: stats.autoHideOutOfStock ? '#f0fdf4' : '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SlidersHorizontal size={20} style={{ color: stats.autoHideOutOfStock ? '#10b981' : '#6b7280' }} />
            <div>
              <b style={{ fontSize: '14px', color: '#111827' }}>Automatic Out-of-Stock Hiding: {stats.autoHideOutOfStock ? 'Enabled' : 'Disabled'}</b>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                When enabled, products with zero stock are automatically hidden from customer search and categories.
              </p>
            </div>
          </div>
          <Button
            variant={stats.autoHideOutOfStock ? 'primary' : 'outline'}
            onClick={handleToggleAutoHide}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {stats.autoHideOutOfStock ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>{stats.autoHideOutOfStock ? 'Auto-Hide Active' : 'Enable Auto-Hide'}</span>
          </Button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <Boxes size={15} />
          <span>Stock Overview</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <History size={15} />
          <span>Stock Adjustment & Movement Logs</span>
        </button>
      </div>

      {/* ================= TAB 1: STOCK OVERVIEW ================= */}
      {activeTab === 'stock' && (
        <>
          <div className="row between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="row gap" style={{ alignItems: 'center' }}>
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search product name or SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadOverview(1)}
                  style={{ width: '220px' }}
                />
              </div>
              <Button variant="ghost" className="admin-filter-btn" onClick={() => loadOverview(1)}>Search</Button>
              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Stock States</option>
                <option value="IN_STOCK">In Stock (Healthy)</option>
                <option value="LOW_STOCK">Low Stock (At or Below Threshold)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0 Left)</option>
                <option value="EXPIRED">Expired Products</option>
                <option value="APPROACHING_EXPIRY">Expiring Soon (Within 14 Days)</option>
              </select>
            </div>
            <small style={{ color: '#6b7280' }}>
              Showing {items.length} of {pagination.total} products
            </small>
          </div>

          <div className="admin-card table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Stock Status</th>
                    <th>Expiry Tracking</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !items.length ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <tr key={`inv-skel-${idx}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="r2c-skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="r2c-skeleton-box" style={{ width: '160px', height: '14px', borderRadius: '4px' }} />
                              <div className="r2c-skeleton-box" style={{ width: '90px', height: '11px', borderRadius: '4px' }} />
                            </div>
                          </div>
                        </td>
                        <td><div className="r2c-skeleton-box" style={{ width: '100px', height: '14px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '60px', height: '16px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '50px', height: '14px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '80px', height: '22px', borderRadius: '12px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '90px', height: '14px', borderRadius: '4px' }} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <div className="r2c-skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                            <div className="r2c-skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                        <span className="text-danger">{error}</span>
                        <Button variant="outline" onClick={() => loadOverview(1)} style={{ marginLeft: '12px' }}>Try Again</Button>
                      </td>
                    </tr>
                  ) : !items.length ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                        No products match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    items.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            {product.image && <img src={product.image} alt="" />}
                            <span>
                              <b>{product.name}</b>
                              <small>{product.sku} · {product.unit}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#4b5563' }}>{product.category?.name || 'General'}</span>
                        </td>
                        <td>
                          <b style={{ fontSize: '15px' }}>{product.stock}</b>
                          <small style={{ color: '#6b7280', marginLeft: '4px' }}>{product.unit}</small>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{product.lowStockThreshold}</span>
                        </td>
                        <td>
                          <StatusBadge
                            status={
                              product.stockStatus === 'OUT_OF_STOCK'
                                ? 'Out of stock'
                                : product.stockStatus === 'LOW_STOCK'
                                ? 'Low stock'
                                : 'Active'
                            }
                          />
                        </td>
                        <td>
                          {product.hasExpiry ? (
                            <div>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: product.expiryStatus === 'EXPIRED' ? '#fee2e2' : product.expiryStatus === 'EXPIRING_SOON' ? '#fef3c7' : '#ecfdf5',
                                color: product.expiryStatus === 'EXPIRED' ? '#b91c1c' : product.expiryStatus === 'EXPIRING_SOON' ? '#b45309' : '#047857'
                              }}>
                                {product.expiryStatus === 'EXPIRED' ? 'EXPIRED' : product.expiryStatus === 'EXPIRING_SOON' ? 'EXPIRING SOON' : 'FRESH'}
                              </span>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                Exp: {product.expiryDate || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>No Expiry</span>
                          )}
                        </td>
                        <td>
                          <div className="row gap" style={{ gap: '6px' }}>
                            <Button
                              variant="outline"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => {
                                setSelectedProduct(product);
                                setAdjustmentTargetStock(String(product.stock));
                                setAdjustmentReason('');
                              }}
                            >
                              <Edit2 size={13} /> Adjust Stock
                            </Button>
                            <Button
                              variant="ghost"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => {
                                setExpiryProduct(product);
                                setHasExpiry(Boolean(product.hasExpiry));
                                setExpiryDate(product.expiryDate || '');
                                setBatchNumber(product.batchNumber || '');
                              }}
                            >
                              <Calendar size={13} /> Expiry
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => loadOverview(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#4b5563' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadOverview(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: MOVEMENT & ADJUSTMENT LOGS ================= */}
      {activeTab === 'logs' && (
        <>
          <div className="row between" style={{ marginBottom: '16px' }}>
            <div className="row gap">
              <select
                value={logTypeFilter}
                onChange={e => setLogTypeFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}
              >
                <option value="">All Movement Types</option>
                <option value="ORDER_DEDUCT">Order Deductions (Sale)</option>
                <option value="ORDER_RESTORE">Order Restorations (Cancellation)</option>
                <option value="MANUAL_RESTOCK">Manual Restock (+)</option>
                <option value="MANUAL_DEDUCTION">Manual Deduction (-)</option>
              </select>
            </div>
            <small style={{ color: '#6b7280' }}>Permanent audit log of every stock change</small>
          </div>

          <div className="admin-card table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Stock Change</th>
                    <th>Quantity Diff</th>
                    <th>Mandatory Reason</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`log-skel-${idx}`}>
                        <td><div className="r2c-skeleton-box" style={{ width: '110px', height: '13px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '150px', height: '14px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '70px', height: '20px', borderRadius: '10px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '60px', height: '14px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '140px', height: '13px', borderRadius: '4px' }} /></td>
                        <td><div className="r2c-skeleton-box" style={{ width: '90px', height: '13px', borderRadius: '4px' }} /></td>
                      </tr>
                    ))
                  ) : !logs.length ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                        No inventory log records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <span style={{ fontSize: '12px', color: '#374151' }}>
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td>
                          <b>{log.product?.name || 'Unknown Product'}</b>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{log.product?.sku}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            background: log.type === 'ORDER_DEDUCT' ? '#fee2e2' : log.type === 'ORDER_RESTORE' ? '#ecfdf5' : '#e0f2fe',
                            color: log.type === 'ORDER_DEDUCT' ? '#b91c1c' : log.type === 'ORDER_RESTORE' ? '#047857' : '#0369a1'
                          }}>
                            {log.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>
                            {log.previousStock} → <b>{log.newStock}</b>
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: log.quantityDiff > 0 ? '#10b981' : log.quantityDiff < 0 ? '#ef4444' : '#6b7280'
                          }}>
                            {log.quantityDiff > 0 ? `+${log.quantityDiff}` : log.quantityDiff}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#1f2937' }}>{log.reason}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#4b5563' }}>
                            {log.adminName || (log.orderId ? `Order System` : 'System')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: Adjust Stock with Mandatory Reason */}
      <Modal
        open={!!selectedProduct}
        onClose={() => !busy && setSelectedProduct(null)}
        title={`Adjust Stock: ${selectedProduct?.name || ''}`}
      >
        <form className="modal-body admin-form" onSubmit={handleSaveAdjustment}>
          <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e5e7eb' }}>
            <div className="row between">
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Current Recorded Stock:</span>
              <b style={{ fontSize: '16px' }}>{selectedProduct?.stock} {selectedProduct?.unit}</b>
            </div>
            {adjustmentTargetStock !== '' && !isNaN(Number(adjustmentTargetStock)) && (
              <div className="row between" style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Calculated Difference:</span>
                <b style={{
                  fontSize: '15px',
                  color: Number(adjustmentTargetStock) - (selectedProduct?.stock || 0) >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {Number(adjustmentTargetStock) - (selectedProduct?.stock || 0) >= 0 ? '+' : ''}
                  {Number(adjustmentTargetStock) - (selectedProduct?.stock || 0)} {selectedProduct?.unit}
                </b>
              </div>
            )}
          </div>

          <label>
            New Stock Quantity (Units)
            <input
              type="number"
              min="0"
              step="1"
              required
              value={adjustmentTargetStock}
              onChange={e => setAdjustmentTargetStock(e.target.value)}
              placeholder="Enter new physical count"
            />
          </label>

          <label>
            Mandatory Adjustment Reason *
            <input
              type="text"
              required
              minLength="3"
              value={adjustmentReason}
              onChange={e => setAdjustmentReason(e.target.value)}
              placeholder="e.g., Physical count audit, Received new distributor shipment, Damaged pack write-off"
            />
            <small style={{ color: '#6b7280' }}>Required by internal audit trail. Saved permanently to inventory logs.</small>
          </label>

          <div className="row end gap" style={{ marginTop: '20px' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button disabled={busy || !adjustmentReason.trim()}>
              {busy ? <LoaderCircle className="spin" /> : <Save />} Save Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Expiry Tracking Configuration */}
      <Modal
        open={!!expiryProduct}
        onClose={() => !busy && setExpiryProduct(null)}
        title={`Expiry & Batch Tracking: ${expiryProduct?.name || ''}`}
      >
        <form className="modal-body admin-form" onSubmit={handleSaveExpiry}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '14px' }}>
            <input
              type="checkbox"
              checked={hasExpiry}
              onChange={e => setHasExpiry(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <b>Track product expiration date for this SKU</b>
          </label>

          {hasExpiry ? (
            <>
              <label>
                Expiration Date *
                <input
                  type="date"
                  required={hasExpiry}
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                />
                <small style={{ color: '#6b7280' }}>Products past this date will automatically be barred from customer checkout.</small>
              </label>

              <label>
                Batch / Lot Number (Optional)
                <input
                  type="text"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  placeholder="e.g., LOT-2026-B4"
                />
              </label>
            </>
          ) : (
            <p className="muted" style={{ padding: '10px 0' }}>
              Expiry tracking is disabled for non-perishable goods (e.g. household items, dry spices, grains).
            </p>
          )}

          <div className="row end gap" style={{ marginTop: '20px' }}>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setExpiryProduct(null)}>
              Cancel
            </Button>
            <Button disabled={busy}>
              {busy ? <LoaderCircle className="spin" /> : <Save />} Save Expiry Config
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
