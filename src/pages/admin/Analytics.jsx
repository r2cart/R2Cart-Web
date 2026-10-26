import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Package,
  Boxes,
  Truck,
  Users,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  CreditCard,
  Building2,
  Trash2,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Layers,
  ShoppingBag,
  ExternalLink,
  Tag,
  Sparkles,
  Activity
} from 'lucide-react';
import { Button, Badge, StatusBadge, money, ConfirmDialog } from '../../components/ui';
import { adminService } from '../../services/admin.service';
import { hasPermission } from '../../utils/permissions';

function formatDelta(deltaVal) {
  if (deltaVal === undefined || deltaVal === null || Number.isNaN(Number(deltaVal))) {
    return { text: '0.0%', isPositive: true, isZero: true };
  }
  const val = Number(deltaVal);
  if (val === 0) {
    return { text: '0.0%', isPositive: true, isZero: true };
  }
  return {
    text: `${val > 0 ? '+' : ''}${val.toFixed(1)}%`,
    isPositive: val > 0,
    isZero: false
  };
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'sales', label: 'Sales Analytics', icon: DollarSign },
  { id: 'products', label: 'Product Performance', icon: ShoppingBag },
  { id: 'purchases', label: 'Purchases & Stock Receipts', icon: Package },
  { id: 'suppliers', label: 'Suppliers & Payables', icon: Building2 },
  { id: 'valuation', label: 'Inventory Valuation', icon: Boxes },
  { id: 'expenses', label: 'Operating Expenses', icon: CreditCard },
  { id: 'pl', label: 'Profit & Loss', icon: FileText },
  { id: 'cashflow', label: 'Cash Flow', icon: Layers },
  { id: 'exports', label: 'Reports & Exports', icon: Download },
  { id: 'audit', label: 'Audit History', icon: ShieldCheck }
];

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7days', label: 'Last 7 Days' },
  { id: 'last30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'Current Month' },
  { id: 'lastMonth', label: 'Previous Month' },
  { id: 'thisYear', label: 'Current Year' },
  { id: 'custom', label: 'Custom Range' }
];

const EXPENSE_CATEGORIES = [
  { id: 'DELIVERY_FUEL', label: 'Delivery & Fuel' },
  { id: 'PACKAGING', label: 'Packaging Materials' },
  { id: 'TRANSPORT_FREIGHT', label: 'Transport & Freight' },
  { id: 'RENT', label: 'Rent & Warehouse' },
  { id: 'UTILITIES', label: 'Electricity & Utilities' },
  { id: 'MAINTENANCE', label: 'Store Maintenance' },
  { id: 'MARKETING', label: 'Marketing & Ads' },
  { id: 'WASTAGE_EXPIRY', label: 'Wastage & Expiry Loss' },
  { id: 'OTHER', label: 'Other Operating Expenses' }
];

const PIE_COLORS = ['#168447', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#10b981'];

function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('grocify-admin-user')) || null;
  } catch {
    return null;
  }
}

export function AdminAnalytics() {
  const currentUser = getAdminUser();
  const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN';

  const canViewCost = isSuper || hasPermission(currentUser, 'analytics.cost_view');
  const canManagePurchases = isSuper || hasPermission(currentUser, 'purchases.manage');
  const canManageSuppliers = isSuper || hasPermission(currentUser, 'suppliers.manage');
  const canManageExpenses = isSuper || hasPermission(currentUser, 'expenses.manage');
  const canExport = isSuper || hasPermission(currentUser, 'reports.export');

  const [activeTab, setActiveTab] = useState('overview');
  const [preset, setPreset] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Core analytics state
  const [overview, setOverview] = useState(null);
  const [trendSeries, setTrendSeries] = useState([]);
  const [productReport, setProductReport] = useState([]);
  const [valuationData, setValuationData] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [supplierPayables, setSupplierPayables] = useState(null);

  // Sub-modules state
  const [purchasesList, setPurchasesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);

  // Modals state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);
  const [finalizingPurchaseId, setFinalizingPurchaseId] = useState(null);

  // Load all overview data
  const loadData = async () => {
    setLoading(true);
    setError('');
    const params = { preset };
    if (preset === 'custom' && customStart && customEnd) {
      params.startDate = customStart;
      params.endDate = customEnd;
    }

    try {
      const [ovData, trendData, prodData, valData, cfData, supPayables] = await Promise.all([
        adminService.getAnalyticsOverview(params),
        adminService.getSalesTrend(params).catch(() => ({ series: [] })),
        adminService.getProductPerformance(params).catch(() => ({ products: [] })),
        adminService.getInventoryValuation().catch(() => null),
        adminService.getCashFlow(params).catch(() => null),
        adminService.getSuppliers().catch(() => [])
      ]);

      setOverview(ovData);
      setTrendSeries(trendData.series || []);
      setProductReport(prodData.products || []);
      setValuationData(valData);
      setCashFlowData(cfData?.cashFlow || null);
      setSupplierPayables(cfData?.supplierPayables || null);
    } catch (err) {
      setError(err.message || 'Failed to load business analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Load secondary lists when tab changes
  useEffect(() => {
    loadData();
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    if (activeTab === 'purchases') {
      adminService.getPurchases().then(res => setPurchasesList(res.items || [])).catch(() => {});
      adminService.getSuppliers().then(setSuppliersList).catch(() => {});
      adminService.getProductPerformance({ preset: 'thisMonth' }).then(res => setProductsCatalog(res.products || [])).catch(() => {});
    } else if (activeTab === 'suppliers') {
      adminService.getSuppliers().then(setSuppliersList).catch(() => {});
    } else if (activeTab === 'expenses') {
      adminService.getExpenses().then(res => setExpensesList(res.items || [])).catch(() => {});
    }
  }, [activeTab]);

  const current = overview?.current || {};
  const deltas = overview?.deltas || {};
  const period = overview?.period || {};

  return (
    <div className="analytics-page">
      {/* Page Header */}
      <div className="analytics-header">
        <div className="header-titles">
          <div className="title-row">
            <h1>Business Analytics & Profit Management</h1>
            {isSuper && <span className="super-admin-badge"><ShieldCheck size={14} /> Super Admin Control</span>}
          </div>
          <p className="subtitle">
            First-In, First-Out (FIFO) inventory costing, verified purchase receipts, expenses, and real-time P&L reporting.
          </p>
        </div>

        <div className="header-actions">
          <button className="secondary-btn" onClick={loadData} disabled={loading} title="Refresh data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="date-filter-toolbar">
        <div className="filter-label">
          <Calendar size={16} />
          <span>Period:</span>
        </div>

        <div className="preset-pills">
          {DATE_PRESETS.map(p => (
            <button
              key={p.id}
              className={`preset-pill ${preset === p.id ? 'active' : ''}`}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="custom-date-inputs">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              placeholder="End Date"
            />
          </div>
        )}

        {period.startFormatted && (
          <div className="timezone-indicator">
            <span className="live-pulse-dot" />
            <Clock size={13} />
            <span>{period.startFormatted} – {period.endFormatted} (Asia/Kolkata)</span>
          </div>
        )}
      </div>

      {/* Incomplete Cost Warning Banner */}
      {current.isCostIncomplete && canViewCost && (
        <div className="cost-warning-alert">
          <AlertTriangle size={20} className="warning-icon" />
          <div className="warning-content">
            <h4>Incomplete Historical FIFO Cost Coverage ({current.costCoveragePercentage}%)</h4>
            <p>
              {current.uncostedUnitsCount} sold units had legacy inventory with no purchase batch cost recorded.
              Profit is calculated strictly on verified units without fabricating fake costs.
              Super Admins can record verified opening costs in the <strong>Inventory Valuation</strong> tab.
            </p>
          </div>
          {isSuper && (
            <button className="reconcile-cta-btn" onClick={() => setShowReconcileModal(true)}>
              Reconcile Opening Cost
            </button>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="analytics-tabs-nav">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="analytics-error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={loadData}>Retry</button>
        </div>
      )}

      {loading ? (
        <AnalyticsSkeleton activeTab={activeTab} />
      ) : (
        <>
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
        <div className="tab-pane overview-pane">
          {/* Executive KPI Grid */}
          <div className="kpi-grid">
            {/* 1. Gross Product Sales */}
            <div className="kpi-card gross-sales-card">
              <div className="kpi-top">
                <div className="kpi-header-group">
                  <div className="kpi-icon-badge bg-indigo">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <span className="kpi-title">Gross Product Sales</span>
                    <div className="kpi-subtag">Fulfilled Orders</div>
                  </div>
                </div>
                {(() => {
                  const d = formatDelta(deltas.grossSales);
                  return (
                    <span className={`kpi-delta ${d.isZero ? 'neutral' : d.isPositive ? 'positive' : 'negative'}`}>
                      {!d.isZero && (d.isPositive ? <ArrowUpRight size={13} strokeWidth={2.5} /> : <ArrowDownRight size={13} strokeWidth={2.5} />)}
                      {d.text}
                    </span>
                  );
                })()}
              </div>
              <div className="kpi-value">{money(current.grossProductSales || 0)}</div>
              <div className="kpi-bottom">
                <span><Truck size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />{current.completedOrderCount || 0} delivered orders</span>
                <span className="dot">•</span>
                <span>{current.totalUnitsSold || 0} units</span>
              </div>
            </div>

            {/* 2. Discounts & Promos */}
            <div className="kpi-card discounts-card">
              <div className="kpi-top">
                <div className="kpi-header-group">
                  <div className="kpi-icon-badge bg-amber">
                    <Tag size={18} />
                  </div>
                  <div>
                    <span className="kpi-title">Discounts & Promos</span>
                    <div className="kpi-subtag">Coupons + Reductions</div>
                  </div>
                </div>
                <span className="kpi-badge-neutral">
                  Reductions
                </span>
              </div>
              <div className="kpi-value text-amber">{money(current.totalDiscounts || 0)}</div>
              <div className="kpi-bottom">
                <span>Coupons: {money(current.couponDiscounts || 0)}</span>
                <span className="dot">•</span>
                <span>Product: {money(current.productDiscounts || 0)}</span>
              </div>
            </div>

            {/* 3. Net Product Sales */}
            <div className="kpi-card net-sales-card">
              <div className="kpi-top">
                <div className="kpi-header-group">
                  <div className="kpi-icon-badge bg-blue">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <span className="kpi-title">Net Product Sales</span>
                    <div className="kpi-subtag">Revenue After Discounts</div>
                  </div>
                </div>
                {(() => {
                  const d = formatDelta(deltas.netSales);
                  return (
                    <span className={`kpi-delta ${d.isZero ? 'neutral' : d.isPositive ? 'positive' : 'negative'}`}>
                      {!d.isZero && (d.isPositive ? <ArrowUpRight size={13} strokeWidth={2.5} /> : <ArrowDownRight size={13} strokeWidth={2.5} />)}
                      {d.text}
                    </span>
                  );
                })()}
              </div>
              <div className="kpi-value text-blue">{money(current.netProductSales || 0)}</div>
              <div className="kpi-bottom">
                <span>AOV: {money(current.averageOrderValue || 0)} per order</span>
              </div>
            </div>

            {canViewCost && (
              <>
                {/* 4. FIFO COGS */}
                <div className="kpi-card cogs-card">
                  <div className="kpi-top">
                    <div className="kpi-header-group">
                      <div className="kpi-icon-badge bg-red">
                        <Package size={18} />
                      </div>
                      <div>
                        <span className="kpi-title">FIFO COGS</span>
                        <div className="kpi-subtag">Cost of Goods Sold</div>
                      </div>
                    </div>
                    <span className="badge-cogs-coverage">
                      {Number(current.costCoveragePercentage ?? 100).toFixed(0)}% verified
                    </span>
                  </div>
                  <div className="kpi-value text-red">{money(current.verifiedCogs || 0)}</div>
                  <div className="kpi-bottom">
                    <span>Batch-wise purchase cost</span>
                  </div>
                </div>

                {/* 5. Gross Profit & Margin */}
                <div className="kpi-card gross-profit-card">
                  <div className="kpi-top">
                    <div className="kpi-header-group">
                      <div className="kpi-icon-badge bg-green">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <span className="kpi-title">Gross Profit & Margin</span>
                        <div className="kpi-subtag">Net Sales – COGS</div>
                      </div>
                    </div>
                    <span className="margin-pill">
                      {Number(current.grossMarginPercentage ?? 0).toFixed(1)}% margin
                    </span>
                  </div>
                  <div className="kpi-value text-green">{money(current.grossProfit || 0)}</div>
                  <div className="kpi-bottom">
                    <span>Contribution margin</span>
                  </div>
                </div>

                {/* 6. Operating Expenses */}
                <div className="kpi-card expenses-card">
                  <div className="kpi-top">
                    <div className="kpi-header-group">
                      <div className="kpi-icon-badge bg-slate">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <span className="kpi-title">Operating Expenses</span>
                        <div className="kpi-subtag">Fuel, Rent, Packaging</div>
                      </div>
                    </div>
                    <span className="kpi-badge-neutral">
                      Period OpEx
                    </span>
                  </div>
                  <div className="kpi-value text-slate">{money(current.totalOperatingExpenses || 0)}</div>
                  <div className="kpi-bottom">
                    <span>Period operational costs</span>
                  </div>
                </div>

                {/* 7. Net Operating Profit */}
                <div className="kpi-card net-profit-card highlighted">
                  <div className="kpi-top">
                    <div className="kpi-header-group">
                      <div className="kpi-icon-badge bg-emerald">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <span className="kpi-title">Net Operating Profit</span>
                        <div className="kpi-subtag">Gross Profit – OpEx</div>
                      </div>
                    </div>
                    <span className="margin-pill dark">
                      {Number(current.netOperatingMarginPercentage ?? 0).toFixed(1)}% net
                    </span>
                  </div>
                  <div className={`kpi-value ${current.netOperatingProfit >= 0 ? 'text-emerald' : 'text-rose'}`}>
                    {money(current.netOperatingProfit || 0)}
                  </div>
                  <div className="kpi-bottom">
                    <span>Bottom-line operational profit</span>
                  </div>
                </div>
              </>
            )}

            {/* 8. Inventory Valuation */}
            <div className="kpi-card valuation-card">
              <div className="kpi-top">
                <div className="kpi-header-group">
                  <div className="kpi-icon-badge bg-purple">
                    <Boxes size={18} />
                  </div>
                  <div>
                    <span className="kpi-title">Inventory Valuation</span>
                    <div className="kpi-subtag">Current Assets</div>
                  </div>
                </div>
                <span className="kpi-badge-neutral">
                  FIFO Assets
                </span>
              </div>
              <div className="kpi-value text-purple">{money(valuationData?.totalValuation || 0)}</div>
              <div className="kpi-bottom">
                <span>{valuationData?.totalSellableUnits || 0} sellable units in warehouse</span>
              </div>
            </div>

            {/* 9. Net Business Cash Flow */}
            <div className="kpi-card cashflow-card">
              <div className="kpi-top">
                <div className="kpi-header-group">
                  <div className="kpi-icon-badge bg-cyan">
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="kpi-title">Net Cash Flow</span>
                    <div className="kpi-subtag">Recorded Movements</div>
                  </div>
                </div>
                <span className="kpi-badge-neutral">
                  Flow
                </span>
              </div>
              <div className={`kpi-value ${(cashFlowData?.netCashFlow || 0) >= 0 ? 'text-green' : 'text-rose'}`}>
                {money(cashFlowData?.netCashFlow || 0)}
              </div>
              <div className="kpi-bottom">
                <span>COD Inflow: {money(cashFlowData?.codCashCollected || 0)}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="overview-charts-grid">
            <div className="chart-panel">
              <div className="chart-header">
                <h3>Sales & Gross Profit Trend</h3>
                <span className="chart-sub">Day-by-day performance in {period.label}</span>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 320 }}>
                {trendSeries.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={trendSeries} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#168447" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#168447" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `₹${v}`} />
                      <Tooltip formatter={(value) => [money(value), '']} />
                      <Area type="monotone" dataKey="netSales" name="Net Sales" stroke="#168447" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                      {canViewCost && (
                        <Area type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart-state">No delivered order sales in this period.</div>
                )}
              </div>
            </div>

            <div className="chart-panel">
              <div className="chart-header">
                <h3>Top Profit Generators</h3>
                <span className="chart-sub">Highest gross margin contributors</span>
              </div>
              <div className="top-products-list">
                {(overview?.insights?.highestProfitItems || []).length > 0 ? (
                  (overview?.insights?.highestProfitItems || []).map((item, idx) => (
                    <div key={item.id} className="top-product-item">
                      <span className="rank-num">#{idx + 1}</span>
                      <div className="product-info">
                        <span className="product-name">{item.name}</span>
                        <span className="product-meta">{item.unitsSold} sold • {item.marginPercent}% margin</span>
                      </div>
                      <div className="product-profit">
                        <span className="profit-value">{money(item.grossProfit)}</span>
                        <span className="revenue-sub">from {money(item.grossSales)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-chart-state">Insufficient sales history in this period.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sales Analytics */}
      {activeTab === 'sales' && (
        <div className="tab-pane sales-pane">
          <div className="pane-header-row">
            <div>
              <h2>Day-wise Sales & Fulfillment Breakdown</h2>
              <p>Verified sales data for delivered orders in {period.label}</p>
            </div>
            {canExport && (
              <a
                className="secondary-btn"
                href={adminService.getExportUrl('sales', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={15} />
                <span>Export Sales CSV</span>
              </a>
            )}
          </div>

          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Gross Product Sales</th>
                  <th>Net Product Sales</th>
                  {canViewCost && <th>FIFO COGS</th>}
                  {canViewCost && <th>Gross Profit</th>}
                  {canViewCost && <th>Gross Margin</th>}
                </tr>
              </thead>
              <tbody>
                {trendSeries.length > 0 ? (
                  trendSeries.map(day => {
                    const margin = day.netSales > 0 ? ((day.grossProfit / day.netSales) * 100).toFixed(1) : 0;
                    return (
                      <tr key={day.date}>
                        <td className="font-semibold">{day.label}</td>
                        <td>{day.ordersCount}</td>
                        <td>{money(day.grossSales)}</td>
                        <td className="font-semibold text-blue">{money(day.netSales)}</td>
                        {canViewCost && <td className="text-red">{money(day.cogs)}</td>}
                        {canViewCost && <td className="font-semibold text-green">{money(day.grossProfit)}</td>}
                        {canViewCost && <td><span className="margin-pill">{margin}%</span></td>}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      No delivered orders recorded in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Product Performance */}
      {activeTab === 'products' && (
        <div className="tab-pane products-pane">
          <div className="pane-header-row">
            <div>
              <h2>Product Performance & Cost Breakdown</h2>
              <p>Historical selling prices, units fulfilled, FIFO COGS, and real contribution margin.</p>
            </div>
            {canExport && (
              <a
                className="secondary-btn"
                href={adminService.getExportUrl('products', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={15} />
                <span>Export Products CSV</span>
              </a>
            )}
          </div>

          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Gross Sales</th>
                  {canViewCost && <th>FIFO COGS</th>}
                  {canViewCost && <th>Gross Profit</th>}
                  {canViewCost && <th>Margin %</th>}
                  <th>Sellable Stock</th>
                  <th>Cost Coverage</th>
                </tr>
              </thead>
              <tbody>
                {productReport.length > 0 ? (
                  productReport.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="product-td-cell">
                          {item.image && <img src={item.image} alt="" className="product-tiny-thumb" />}
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-slate-400">SKU: {item.sku} • {item.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td className="font-bold">{item.unitsSold}</td>
                      <td className="font-semibold">{money(item.grossSales)}</td>
                      {canViewCost && <td className="text-red">{money(item.cogs)}</td>}
                      {canViewCost && <td className="font-semibold text-green">{money(item.grossProfit)}</td>}
                      {canViewCost && (
                        <td>
                          <span className={`margin-pill ${item.marginPercent >= 20 ? 'high' : item.marginPercent >= 10 ? 'med' : 'low'}`}>
                            {item.marginPercent}%
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={`stock-badge ${item.currentStock <= 5 ? 'critical' : 'normal'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td>
                        {item.isCostComplete ? (
                          <span className="badge-cost-verified"><CheckCircle2 size={12} /> 100% FIFO</span>
                        ) : (
                          <span className="badge-cost-partial"><AlertTriangle size={12} /> {item.uncostedUnits} uncosted</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-slate-500">
                      No products sold in this reporting period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Purchases & Stock Receipts */}
      {activeTab === 'purchases' && (
        <div className="tab-pane purchases-pane">
          <div className="pane-header-row">
            <div>
              <h2>Purchases & Inventory Cost Receipts</h2>
              <p>Record supplier purchase invoices. Stock increases only when finalized into FIFO batches.</p>
            </div>
            {canManagePurchases && (
              <button className="primary-btn" onClick={() => setShowPurchaseModal(true)}>
                <Plus size={15} />
                <span>New Purchase Draft</span>
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Invoice #</th>
                  <th>Purchase Date</th>
                  <th>Line Items</th>
                  <th>Landed Freight</th>
                  <th>Total Amount</th>
                  <th>Receipt Status</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchasesList.length > 0 ? (
                  purchasesList.map(po => (
                    <tr key={po.id}>
                      <td className="font-semibold">{po.purchaseNumber}</td>
                      <td>{po.supplier?.name}</td>
                      <td>{po.invoiceNumber || '—'}</td>
                      <td>{new Date(po.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{po.items?.length || 0} products</td>
                      <td>{money(po.freightLandedCost || 0)}</td>
                      <td className="font-bold">{money(po.totalAmount)}</td>
                      <td>
                        <span className={`status-pill status-${po.status.toLowerCase()}`}>
                          {po.status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-pill payment-${po.paymentStatus.toLowerCase()}`}>
                          {po.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {po.status === 'DRAFT' && canManagePurchases && (
                          <button
                            className="finalize-btn"
                            onClick={() => setFinalizingPurchaseId(po.id)}
                            title="Receive stock into FIFO batches"
                          >
                            <CheckCircle2 size={13} />
                            <span>Finalize Stock Receipt</span>
                          </button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="text-xs text-green-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Batches Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-500">
                      No purchase orders recorded yet. Create a draft above to begin batch tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Suppliers & Payables */}
      {activeTab === 'suppliers' && (
        <div className="tab-pane suppliers-pane">
          <div className="pane-header-row">
            <div>
              <h2>Suppliers Directory & Outstanding Payables</h2>
              <p>Track supplier contacts, total purchases, payments made, and net balances.</p>
            </div>
            {canManageSuppliers && (
              <button className="primary-btn" onClick={() => setShowSupplierModal(true)}>
                <Plus size={15} />
                <span>Add Supplier</span>
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone / Email</th>
                  <th>Total Recorded Purchases</th>
                  <th>Payments Made</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliersList.length > 0 ? (
                  suppliersList.map(sup => (
                    <tr key={sup.id}>
                      <td className="font-semibold">{sup.code}</td>
                      <td className="font-bold">{sup.name}</td>
                      <td>{sup.contactPerson || '—'}</td>
                      <td>
                        <div>{sup.phone || '—'}</div>
                        <div className="text-xs text-slate-400">{sup.email}</div>
                      </td>
                      <td>{money(sup.totalPurchases || 0)}</td>
                      <td className="text-green font-semibold">{money(sup.totalPayments || 0)}</td>
                      <td>
                        <span className={`balance-badge ${sup.outstandingBalance > 0 ? 'owing' : 'clear'}`}>
                          {money(sup.outstandingBalance || 0)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${sup.status?.toLowerCase() || 'active'}`}>
                          {sup.status}
                        </span>
                      </td>
                      <td>
                        {canManageSuppliers && (
                          <button
                            className="record-pay-btn"
                            onClick={() => {
                              setSelectedSupplierForPayment(sup);
                              setShowPaymentModal(true);
                            }}
                          >
                            <CreditCard size={13} />
                            <span>Record Payment</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-slate-500">
                      No suppliers registered. Click "Add Supplier" to create your first vendor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Inventory Valuation */}
      {activeTab === 'valuation' && (
        <div className="tab-pane valuation-pane">
          <div className="pane-header-row">
            <div>
              <h2>FIFO Inventory Valuation & Batch Balances</h2>
              <p>Asset valuation based on remaining eligible batch quantities and landed costs.</p>
            </div>
            <div className="flex gap-2">
              {isSuper && (
                <button className="secondary-btn" onClick={() => setShowReconcileModal(true)}>
                  <Plus size={14} />
                  <span>Reconcile Opening Cost</span>
                </button>
              )}
              {hasPermission(currentUser, 'inventory.manage') && (
                <button className="secondary-btn danger" onClick={() => setShowWastageModal(true)}>
                  <Trash2 size={14} />
                  <span>Write-Off Wastage</span>
                </button>
              )}
              {canExport && (
                <a
                  className="secondary-btn"
                  href={adminService.getExportUrl('inventory', { preset, startDate: customStart, endDate: customEnd })}
                  download
                >
                  <Download size={14} />
                  <span>Export Valuation CSV</span>
                </a>
              )}
            </div>
          </div>

          <div className="valuation-summary-strip">
            <div className="summary-stat">
              <span className="stat-label">Total Verified Inventory Asset Valuation</span>
              <span className="stat-num text-green">{money(valuationData?.totalValuation || 0)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total Sellable Units</span>
              <span className="stat-num">{valuationData?.totalSellableUnits || 0}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Uncosted Legacy Units</span>
              <span className={`stat-num ${(valuationData?.totalUncostedUnits || 0) > 0 ? 'text-amber' : 'text-slate'}`}>
                {valuationData?.totalUncostedUnits || 0}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Cost Reconciliation Coverage</span>
              <span className="stat-num text-blue">{valuationData?.reconciliationCoveragePercent || 100}%</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Sellable Stock</th>
                  <th>Tracked FIFO Units</th>
                  <th>Uncosted Units</th>
                  <th>Asset Valuation</th>
                  <th>Reconciliation Status</th>
                </tr>
              </thead>
              <tbody>
                {(valuationData?.products || []).length > 0 ? (
                  (valuationData?.products || []).map(p => (
                    <tr key={p.id}>
                      <td className="font-semibold">
                        <div>{p.name}</div>
                        <div className="text-xs text-slate-400">SKU: {p.sku} • {p.unit}</div>
                      </td>
                      <td>{p.category}</td>
                      <td className="font-bold">{p.stock}</td>
                      <td>{p.batchUnits} units in {p.batchesCount} batches</td>
                      <td>
                        {p.uncostedUnits > 0 ? (
                          <span className="text-amber-600 font-semibold">{p.uncostedUnits} units</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="font-bold text-green">{money(p.valuation)}</td>
                      <td>
                        {p.isFullyReconciled ? (
                          <span className="badge-cost-verified"><CheckCircle2 size={12} /> Verified</span>
                        ) : (
                          <span className="badge-cost-partial"><AlertTriangle size={12} /> Needs Reconciliation</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      No products found in catalogue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Operating Expenses */}
      {activeTab === 'expenses' && (
        <div className="tab-pane expenses-pane">
          <div className="pane-header-row">
            <div>
              <h2>Operating Expenses (OpEx)</h2>
              <p>Track business running costs. Subtracted from Gross Profit to derive Net Operating Profit.</p>
            </div>
            {canManageExpenses && (
              <button className="primary-btn" onClick={() => setShowExpenseModal(true)}>
                <Plus size={15} />
                <span>Record Expense</span>
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Expense #</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Payee</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expensesList.length > 0 ? (
                  expensesList.map(exp => (
                    <tr key={exp.id}>
                      <td className="font-semibold">{exp.expenseNumber}</td>
                      <td>
                        <span className="expense-category-pill">
                          {EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label || exp.category}
                        </span>
                      </td>
                      <td>{exp.description}</td>
                      <td>{new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{exp.paymentMethod}</td>
                      <td>{exp.payee || '—'}</td>
                      <td className="font-bold text-slate-800">{money(exp.amount)}</td>
                      <td>
                        <span className={`status-pill status-${exp.status.toLowerCase()}`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-500">
                      No operating expenses recorded yet. Click "Record Expense" to add delivery fuel, rent, or packaging costs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Profit & Loss Statement */}
      {activeTab === 'pl' && (
        <div className="tab-pane pl-pane">
          <div className="pane-header-row">
            <div>
              <h2>Profit & Loss (P&L) Statement</h2>
              <p>Accounting statement for {period.label} ({period.startFormatted} to {period.endFormatted})</p>
            </div>
            {canExport && (
              <a
                className="secondary-btn"
                href={adminService.getExportUrl('pl', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={15} />
                <span>Export P&L CSV</span>
              </a>
            )}
          </div>

          <div className="pl-statement-card">
            <div className="pl-statement-header">
              <h3>R2Cart Grocery Operations — Statement of Operating Profit</h3>
              <p>Financial reporting currency: INR (₹) • Accrual-basis FIFO Costing</p>
            </div>

            <div className="pl-line-items">
              <div className="pl-row major">
                <span className="line-title">1. Gross Product Sales</span>
                <span className="line-val">{money(current.grossProductSales || 0)}</span>
              </div>
              <div className="pl-row indent">
                <span className="line-title">Less: Product & Coupon Discounts</span>
                <span className="line-val text-red">- {money(current.totalDiscounts || 0)}</span>
              </div>
              <div className="pl-row subtotal">
                <span className="line-title">Net Product Sales (Revenue)</span>
                <span className="line-val text-blue font-bold">{money(current.netProductSales || 0)}</span>
              </div>

              <div className="pl-row major mt-4">
                <span className="line-title">2. Cost of Goods Sold (FIFO Basis)</span>
                <span className="line-val text-red">- {money(current.verifiedCogs || 0)}</span>
              </div>
              <div className="pl-row indent text-xs text-slate-500">
                <span>Verified FIFO cost coverage on delivered units</span>
                <span>{current.costCoveragePercentage}%</span>
              </div>
              <div className="pl-row subtotal highlight-green">
                <span className="line-title">Gross Operating Profit</span>
                <div className="flex items-center gap-3">
                  <span className="margin-pill">{current.grossMarginPercentage}% Margin</span>
                  <span className="line-val font-bold text-green">{money(current.grossProfit || 0)}</span>
                </div>
              </div>

              <div className="pl-row major mt-4">
                <span className="line-title">3. Operating Expenses (OpEx)</span>
                <span className="line-val text-slate">- {money(current.totalOperatingExpenses || 0)}</span>
              </div>
              <div className="pl-row subtotal highlight-emerald">
                <div>
                  <span className="line-title font-bold">Net Operating Profit</span>
                  <div className="text-xs text-slate-500">Earnings before taxes, loan financing, or asset depreciation</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="margin-pill dark">{current.netOperatingMarginPercentage}%</span>
                  <span className="line-val font-bold text-emerald-700">{money(current.netOperatingProfit || 0)}</span>
                </div>
              </div>
            </div>

            <div className="pl-footnote">
              <Info size={14} />
              <span>
                Note: Unsold inventory purchases are retained as current inventory assets on the balance sheet and are not charged directly as COGS until units are sold.
                Net operating profit excludes external business financing, statutory income taxes, and equipment depreciation.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Cash Flow */}
      {activeTab === 'cashflow' && (
        <div className="tab-pane cashflow-pane">
          <div className="pane-header-row">
            <div>
              <h2>Business Cash Movement & Reconciliation</h2>
              <p>Cash collected from customer COD deliveries versus payments made to suppliers and operations.</p>
            </div>
          </div>

          <div className="cashflow-grid">
            <div className="cf-card inflow">
              <h3>Total Cash Inflows</h3>
              <div className="cf-val text-green">{money(cashFlowData?.totalInflows || 0)}</div>
              <div className="cf-breakdown">
                <div className="cf-row">
                  <span>COD Cash Actually Collected:</span>
                  <span className="font-semibold">{money(cashFlowData?.codCashCollected || 0)}</span>
                </div>
                <div className="cf-row">
                  <span>COD Cash Reconciled & Settled:</span>
                  <span className="font-semibold">{money(cashFlowData?.codCashSettled || 0)}</span>
                </div>
              </div>
            </div>

            <div className="cf-card outflow">
              <h3>Total Cash Outflows</h3>
              <div className="cf-val text-red">{money(cashFlowData?.totalOutflows || 0)}</div>
              <div className="cf-breakdown">
                <div className="cf-row">
                  <span>Supplier Purchase Payments Made:</span>
                  <span className="font-semibold">{money(cashFlowData?.supplierPayments || 0)}</span>
                </div>
                <div className="cf-row">
                  <span>Operating Expenses Paid:</span>
                  <span className="font-semibold">{money(cashFlowData?.operatingExpensesPaid || 0)}</span>
                </div>
              </div>
            </div>

            <div className="cf-card net">
              <h3>Net Cash Position</h3>
              <div className={`cf-val ${(cashFlowData?.netCashFlow || 0) >= 0 ? 'text-green' : 'text-rose'}`}>
                {money(cashFlowData?.netCashFlow || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Derived strictly from recorded cash collections and documented business disbursements in this period.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 10: Reports & Exports */}
      {activeTab === 'exports' && (
        <div className="tab-pane exports-pane">
          <div className="pane-header-row">
            <div>
              <h2>Standard Financial Reports & CSV Exports</h2>
              <p>Download comprehensive datasets matching authorized date filters.</p>
            </div>
          </div>

          <div className="exports-grid">
            <div className="export-card">
              <div className="export-icon"><DollarSign size={24} /></div>
              <h4>Sales Performance Ledger</h4>
              <p>Daily and itemized sales, gross revenue, net revenue, discounts, and order volumes.</p>
              <a
                className="export-btn"
                href={adminService.getExportUrl('sales', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={14} /> Download CSV
              </a>
            </div>

            <div className="export-card">
              <div className="export-icon"><ShoppingBag size={24} /></div>
              <h4>Product Profitability Report</h4>
              <p>Product-wise units sold, revenue, FIFO COGS, gross profit margins, and cost coverage status.</p>
              <a
                className="export-btn"
                href={adminService.getExportUrl('products', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={14} /> Download CSV
              </a>
            </div>

            <div className="export-card">
              <div className="export-icon"><Boxes size={24} /></div>
              <h4>FIFO Inventory Valuation</h4>
              <p>Active batch counts, landed unit costs, stock valuations, and uncosted legacy units.</p>
              <a
                className="export-btn"
                href={adminService.getExportUrl('inventory', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={14} /> Download CSV
              </a>
            </div>

            <div className="export-card">
              <div className="export-icon"><Building2 size={24} /></div>
              <h4>Supplier Payables Ledger</h4>
              <p>Supplier profiles, cumulative purchases, payments recorded, and outstanding liabilities.</p>
              <a
                className="export-btn"
                href={adminService.getExportUrl('suppliers', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={14} /> Download CSV
              </a>
            </div>

            <div className="export-card">
              <div className="export-icon"><FileText size={24} /></div>
              <h4>Profit & Loss Statement (P&L)</h4>
              <p>Official statement of Gross Sales, Net Sales, Verified COGS, OpEx, and Net Operating Profit.</p>
              <a
                className="export-btn"
                href={adminService.getExportUrl('pl', { preset, startDate: customStart, endDate: customEnd })}
                download
              >
                <Download size={14} /> Download CSV
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab 11: Audit History */}
      {activeTab === 'audit' && (
        <div className="tab-pane audit-pane">
          <div className="pane-header-row">
            <div>
              <h2>Financial & Cost Audit Trail</h2>
              <p>Permanent log of purchase finalizations, opening stock reconciliations, and expense records.</p>
            </div>
          </div>
          <div className="audit-note">
            <ShieldCheck size={18} className="text-green-600" />
            <span>
              All financial actions (purchases, payments, write-offs, opening stock reconciliations) are permanently logged with user ID, actor timestamp, and IP address.
              Inspect the comprehensive system log in the <strong>Security & Staff</strong> module.
            </span>
          </div>
        </div>
      )}
        </>
      )}

      {/* Modal 1: New Purchase Draft */}
      {showPurchaseModal && (
        <NewPurchaseModal
          suppliers={suppliersList}
          products={productsCatalog}
          onClose={() => setShowPurchaseModal(false)}
          onCreated={() => {
            setShowPurchaseModal(false);
            adminService.getPurchases().then(res => setPurchasesList(res.items || []));
            loadData();
          }}
        />
      )}

      {/* Modal 2: Add Supplier */}
      {showSupplierModal && (
        <AddSupplierModal
          onClose={() => setShowSupplierModal(false)}
          onCreated={() => {
            setShowSupplierModal(false);
            adminService.getSuppliers().then(setSuppliersList);
            loadData();
          }}
        />
      )}

      {/* Modal 3: Record Supplier Payment */}
      {showPaymentModal && selectedSupplierForPayment && (
        <RecordPaymentModal
          supplier={selectedSupplierForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedSupplierForPayment(null);
          }}
          onRecorded={() => {
            setShowPaymentModal(false);
            setSelectedSupplierForPayment(null);
            adminService.getSuppliers().then(setSuppliersList);
            loadData();
          }}
        />
      )}

      {/* Modal 4: Record Operating Expense */}
      {showExpenseModal && (
        <RecordExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onRecorded={() => {
            setShowExpenseModal(false);
            adminService.getExpenses().then(res => setExpensesList(res.items || []));
            loadData();
          }}
        />
      )}

      {/* Modal 5: Reconcile Opening Stock (Super Admin) */}
      {showReconcileModal && (
        <ReconcileOpeningStockModal
          products={valuationData?.products || []}
          onClose={() => setShowReconcileModal(false)}
          onReconciled={() => {
            setShowReconcileModal(false);
            loadData();
          }}
        />
      )}

      {/* Modal 6: Write-off Stock Wastage */}
      {showWastageModal && (
        <RecordWastageModal
          products={valuationData?.products || []}
          onClose={() => setShowWastageModal(false)}
          onRecorded={() => {
            setShowWastageModal(false);
            loadData();
          }}
        />
      )}

      {/* Finalize Purchase Confirmation Dialog */}
      <ConfirmDialog
        open={!!finalizingPurchaseId}
        onClose={() => setFinalizingPurchaseId(null)}
        onConfirm={async () => {
          await adminService.finalizePurchase(finalizingPurchaseId);
          setFinalizingPurchaseId(null);
          adminService.getPurchases().then(res => setPurchasesList(res.items || []));
          loadData();
        }}
        title="Finalize Purchase & Receive Stock?"
        itemType="Purchase Order"
        message="Finalizing this purchase order will immediately generate immutable FIFO cost batches, allocate landed freight, and increment product stock levels. This action cannot be reversed without an auditable stock adjustment."
        confirmText="Finalize & Receive Stock"
        cancelText="Keep as Draft"
      />
    </div>
  );
}

/**
 * Modal: Create New Purchase Draft
 */
function NewPurchaseModal({ suppliers, products, onClose, onCreated }) {
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [freightLandedCost, setFreightLandedCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0, batchNumber: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitCost: 0, batchNumber: '' }]);
  };

  const handleRemoveItem = idx => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, itm) => sum + (Number(itm.quantity || 0) * Number(itm.unitCost || 0)), 0);
  const totalAmount = subtotal + Number(freightLandedCost || 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.some(i => !i.productId || i.quantity <= 0 || i.unitCost <= 0)) {
      setError('All items must have a product, quantity > 0, and unit cost > 0');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await adminService.createPurchase({
        supplierId,
        invoiceNumber,
        purchaseDate,
        freightLandedCost: Number(freightLandedCost || 0),
        notes,
        items
      });
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analytics-modal-backdrop">
      <div className="analytics-modal-content max-w-2xl">
        <div className="modal-header">
          <h3>Record Purchase Invoice (Draft)</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-box">{error}</div>}

          <div className="form-grid-2">
            <div className="form-group">
              <label>Supplier *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Supplier Invoice / Bill #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-9842"
              />
            </div>

            <div className="form-group">
              <label>Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Landed Freight / Transport Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freightLandedCost}
                onChange={e => setFreightLandedCost(e.target.value)}
                placeholder="0.00"
              />
              <span className="field-hint">Allocated into FIFO unit costs upon finalization</span>
            </div>
          </div>

          <div className="items-section-header">
            <h4>Purchase Line Items</h4>
            <button type="button" className="add-line-btn" onClick={handleAddItem}>
              <Plus size={13} /> Add Product
            </button>
          </div>

          <div className="purchase-items-list">
            {items.map((itm, idx) => (
              <div key={idx} className="purchase-item-row">
                <select
                  value={itm.productId}
                  onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={itm.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                  placeholder="Qty"
                  title="Quantity"
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={itm.unitCost}
                  onChange={e => handleItemChange(idx, 'unitCost', e.target.value)}
                  placeholder="Unit Cost (₹)"
                  title="Unit Cost"
                  required
                />

                <input
                  type="text"
                  value={itm.batchNumber}
                  onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                  placeholder="Batch # (optional)"
                />

                {items.length > 1 && (
                  <button type="button" className="remove-item-btn" onClick={() => handleRemoveItem(idx)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="purchase-totals-strip">
            <div>Subtotal: <strong>{money(subtotal)}</strong></div>
            <div>Freight Landed: <strong>{money(freightLandedCost || 0)}</strong></div>
            <div className="text-lg text-emerald-800">Total Purchase: <strong>{money(totalAmount)}</strong></div>
          </div>

          <div className="form-group mt-3">
            <label>Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Delivered by truck DL-1AB-2345"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Saving Draft…' : 'Save Purchase Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Add Supplier
 */
function AddSupplierModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminService.createSupplier({
        name,
        code: code || undefined,
        contactPerson,
        phone,
        email,
        address,
        notes
      });
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analytics-modal-backdrop">
      <div className="analytics-modal-content">
        <div className="modal-header">
          <h3>Add New Supplier</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-box">{error}</div>}

          <div className="form-group">
            <label>Supplier / Company Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Sunrise Organic Farms" />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Supplier Code (Optional)</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Auto-generated if blank" />
            </div>
            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. Ramesh Kumar" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vendor@example.com" />
            </div>
          </div>

          <div className="form-group">
            <label>Warehouse / Business Address</label>
            <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Mandi / Market yard address" />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Record Supplier Payment
 */
function RecordPaymentModal({ supplier, onClose, onRecorded }) {
  const [amount, setAmount] = useState(supplier.outstandingBalance || '');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid payment amount > 0');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await adminService.recordSupplierPayment(supplier.id, {
        amount: Number(amount),
        paymentMethod,
        reference,
        notes
      });
      onRecorded();
    } catch (err) {
      setError(err.message || 'Failed to record supplier payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analytics-modal-backdrop">
      <div className="analytics-modal-content">
        <div className="modal-header">
          <h3>Record Payment to {supplier.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-box">{error}</div>}

          <div className="balance-info-callout">
            <div>Current Outstanding Balance:</div>
            <div className="text-xl font-bold text-rose-700">{money(supplier.outstandingBalance || 0)}</div>
          </div>

          <div className="form-group">
            <label>Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>UTR / Transaction Reference</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="UTR / Ref #" />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment remarks" />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Record Operating Expense
 */
function RecordExpenseModal({ onClose, onRecorded }) {
  const [category, setCategory] = useState('DELIVERY_FUEL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payee, setPayee] = useState('');
  const [reference, setReference] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) {
      setError('Description and valid amount > 0 are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await adminService.createExpense({
        category,
        description,
        amount: Number(amount),
        paymentMethod,
        payee,
        reference,
        expenseDate,
        notes
      });
      onRecorded();
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analytics-modal-backdrop">
      <div className="analytics-modal-content">
        <div className="modal-header">
          <h3>Record Business Operating Expense</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-box">{error}</div>}

          <div className="form-grid-2">
            <div className="form-group">
              <label>Expense Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description / Purpose *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Delivery rider petrol allowance for Zone A"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date of Expense</label>
              <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Payee / Vendor</label>
              <input type="text" value={payee} onChange={e => setPayee(e.target.value)} placeholder="e.g. HP Petrol Pump" />
            </div>
            <div className="form-group">
              <label>Bill / Receipt Ref #</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Bill #" />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Recording…' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Reconcile Opening Stock (Super Admin)
 */
function ReconcileOpeningStockModal({ products, onClose, onReconciled }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!productId || !quantity || !unitCost) {
      setError('Product, quantity, and verified unit cost are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await adminService.reconcileOpeningStock({
        productId,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        notes
      });
      onReconciled();
    } catch (err) {
      setError(err.message || 'Failed to reconcile opening stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analytics-modal-backdrop">
      <div className="analytics-modal-content">
        <div className="modal-header">
          <h3>Reconcile Opening Inventory Cost</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-box">{error}</div>}

          <div className="form-group">
            <label>Product *</label>
            <select
              value={productId}
              onChange={e => {
                setProductId(e.target.value);
                const p = products.find(prod => prod.id === e.target.value);
                if (p && p.uncostedUnits > 0) setQuantity(p.uncostedUnits);
              }}
              required
            >
              <option value="">Select product to reconcile</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.uncostedUnits} uncosted of {p.stock} units)
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="balance-info-callout">
              <div>Current Sellable Stock: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong></div>
              <div>Uncosted Legacy Units: <strong>{selectedProduct.uncostedUnits}</strong></div>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label>Reconciled Quantity *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Verified Unit Purchase Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                placeholder="Verified base cost"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Verification Notes / Source</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Verified from physical opening ledger Oct 2026"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Creating Batch…' : 'Create Verified FIFO Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal: Write-off Stock Wastage & Spoilage
 */
function RecordWastageModal({ products, onClose, onRecorded }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('EXPIRED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!productId || !quantity || Number(quantity) <= 0) {
      setError('Please select product and quantity > 0');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await adminService.recordWastage({
        productId,
        quantity: Number(quantity),
        reason,
        notes
      });
      onRecorded();
    } catch (err) {
      setError(err.message || 'Failed to record wastage write-off');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analytics-modal-backdrop">
      <div className="analytics-modal-content">
        <div className="modal-header">
          <h3>Record Inventory Wastage / Spoilage</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-box">{error}</div>}

          <div className="form-group">
            <label>Product *</label>
            <select value={productId} onChange={e => setProductId(e.target.value)} required>
              <option value="">Select product to write off</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Units to Remove *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Write-Off Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)}>
                <option value="EXPIRED">Expired Stock</option>
                <option value="DAMAGED">Damaged in Transit / Handling</option>
                <option value="SPOILED">Perishable Spoilage</option>
                <option value="INTERNAL_LOSS">Shrinkage / Inventory Loss</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes / Disposal Details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Packaging seal broken upon arrival"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn danger" disabled={submitting}>
              {submitting ? 'Writing Off…' : 'Confirm Wastage Write-Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnalyticsSkeleton({ activeTab = 'overview' }) {
  const kpis = [
    { accent: '#6366f1' },
    { accent: '#f59e0b' },
    { accent: '#2563eb' },
    { accent: '#ef4444' },
    { accent: '#10b981' },
    { accent: '#64748b' },
    { accent: '#059669' },
    { accent: '#8b5cf6' }
  ];

  return (
    <div className="tab-pane analytics-skeleton-pane" aria-label="Loading analytics data">
      {/* 1. Executive KPI Cards Skeleton (matches exactly the 8 KPI cards in Overview) */}
      <div className="kpi-grid">
        {kpis.map((item, idx) => (
          <div key={idx} className="kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: item.accent }} />
            <div className="kpi-top">
              <div className="kpi-header-group">
                <div className="r2c-skeleton-box" style={{ width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0 }} />
                <div>
                  <div className="r2c-skeleton-box" style={{ width: idx % 2 === 0 ? '120px' : '100px', height: '14px', borderRadius: '4px', marginBottom: '6px' }} />
                  <div className="r2c-skeleton-box" style={{ width: '70px', height: '10px', borderRadius: '4px' }} />
                </div>
              </div>
              <div className="r2c-skeleton-box" style={{ width: '56px', height: '22px', borderRadius: '20px' }} />
            </div>
            <div className="r2c-skeleton-box" style={{ width: idx % 3 === 0 ? '110px' : idx % 3 === 1 ? '85px' : '95px', height: '32px', borderRadius: '8px', margin: '14px 0 12px' }} />
            <div className="kpi-bottom" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="r2c-skeleton-box" style={{ width: '130px', height: '11px', borderRadius: '4px' }} />
              <div className="r2c-skeleton-box" style={{ width: '45px', height: '11px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Charts Section Skeleton */}
      <div className="analytics-charts-skeleton-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Main Chart Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div className="r2c-skeleton-box" style={{ width: '180px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
              <div className="r2c-skeleton-box" style={{ width: '240px', height: '11px', borderRadius: '4px' }} />
            </div>
            <div className="r2c-skeleton-box" style={{ width: '90px', height: '28px', borderRadius: '8px' }} />
          </div>
          <div className="r2c-skeleton-box" style={{ width: '100%', height: '260px', borderRadius: '12px' }} />
        </div>

        {/* Side Breakdown Chart Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px' }}>
            <div className="r2c-skeleton-box" style={{ width: '150px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
            <div className="r2c-skeleton-box" style={{ width: '190px', height: '11px', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div className="r2c-skeleton-box" style={{ width: '140px', height: '140px', borderRadius: '50%' }} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="r2c-skeleton-box" style={{ width: '100%', height: '12px', borderRadius: '4px' }} />
              <div className="r2c-skeleton-box" style={{ width: '75%', height: '12px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Table / List Skeleton */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div className="r2c-skeleton-box" style={{ width: '160px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
            <div className="r2c-skeleton-box" style={{ width: '210px', height: '11px', borderRadius: '4px' }} />
          </div>
          <div className="r2c-skeleton-box" style={{ width: '120px', height: '32px', borderRadius: '8px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="r2c-skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
                <div>
                  <div className="r2c-skeleton-box" style={{ width: i % 2 === 0 ? '160px' : '130px', height: '13px', borderRadius: '4px', marginBottom: '4px' }} />
                  <div className="r2c-skeleton-box" style={{ width: '90px', height: '10px', borderRadius: '4px' }} />
                </div>
              </div>
              <div className="r2c-skeleton-box" style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
              <div className="r2c-skeleton-box" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
