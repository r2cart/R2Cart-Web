import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, TrendingUp, Layers, CheckCircle2, AlertTriangle, AlertCircle, 
  RotateCcw, Save, Send, Eye, RefreshCw, Plus, X, Search, ChevronRight, 
  HelpCircle, Sliders, ShieldCheck, ArrowUpDown, Tag, Info, Check, Package
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useApp } from '../../context/AppContext';

export function AdminRanking() {
  const { notify } = useApp();

  const [activeTab, setActiveTab] = useState('bestSellers'); // 'bestSellers' | 'topPicks' | 'preview' | 'history'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  // Configuration state
  const [activeConfig, setActiveConfig] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modals
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState(null);

  // Preview state
  const [previewTarget, setPreviewTarget] = useState('draft');
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Search in product picker
  const [productSearch, setProductSearch] = useState('');
  const [pickerModal, setPickerModal] = useState({ open: false, mode: '', targetList: '' });

  // Fetch initial config and catalog
  const loadData = async () => {
    setLoading(true);
    try {
      const [cfgRes, prods, cats] = await Promise.all([
        adminService.getHomepageRankingConfig(),
        adminService.products(),
        adminService.categories()
      ]);

      if (cfgRes) {
        setActiveConfig(cfgRes.active);
        setDraftConfig(cfgRes.draft);
      }
      if (prods) setCatalogProducts(prods);
      if (cats) setCategories(cats);
    } catch (err) {
      notify(err.message || 'Failed to load ranking configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch preview when switching to preview tab or target changes
  const fetchPreview = async (target = previewTarget) => {
    setPreviewLoading(true);
    try {
      const res = await adminService.previewHomepageRanking(target);
      if (res) setPreviewData(res);
    } catch (err) {
      notify(err.message || 'Failed to generate preview', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'preview') {
      fetchPreview(previewTarget);
    }
  }, [activeTab, previewTarget]);

  // Handle Draft updates
  const updateDraftBestSellers = (key, val) => {
    setDraftConfig(prev => ({
      ...prev,
      bestSellers: {
        ...prev.bestSellers,
        [key]: val
      }
    }));
  };

  const updateDraftTopPicks = (key, val) => {
    setDraftConfig(prev => ({
      ...prev,
      topPicks: {
        ...prev.topPicks,
        [key]: val
      }
    }));
  };

  const updateBsWeight = (weightKey, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setDraftConfig(prev => ({
      ...prev,
      bestSellers: {
        ...prev.bestSellers,
        weights: {
          ...prev.bestSellers.weights,
          [weightKey]: num
        }
      }
    }));
  };

  const updateTpWeight = (weightKey, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setDraftConfig(prev => ({
      ...prev,
      topPicks: {
        ...prev.topPicks,
        weights: {
          ...prev.topPicks.weights,
          [weightKey]: num
        }
      }
    }));
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await adminService.saveHomepageRankingDraft({
        bestSellers: draftConfig.bestSellers,
        topPicks: draftConfig.topPicks
      });
      if (res) {
        setDraftConfig(prev => ({ ...prev, ...res }));
        notify('Draft configuration saved successfully', 'success');
      }
    } catch (err) {
      notify(err.message || 'Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Publish Draft
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await adminService.publishHomepageRanking({ note: publishNote });
      if (res) {
        notify(`Version ${res.version} published to live store!`, 'success');
        setPublishModalOpen(false);
        setPublishNote('');
        await loadData();
        if (activeTab === 'preview') fetchPreview('active');
      }
    } catch (err) {
      notify(err.message || 'Failed to publish configuration', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Load History
  const openHistory = async () => {
    setHistoryModalOpen(true);
    try {
      const hist = await adminService.getHomepageRankingHistory();
      if (hist) setHistoryList(hist);
    } catch (err) {
      notify(err.message || 'Failed to load history', 'error');
    }
  };

  // Rollback
  const handleRollback = async (version) => {
    if (!window.confirm(`Are you sure you want to roll back to version ${version}? Current live ranking will immediately revert.`)) {
      return;
    }
    setRollingBack(true);
    try {
      const res = await adminService.rollbackHomepageRanking({ version });
      if (res) {
        notify(`Successfully rolled back to version ${version}`, 'success');
        setHistoryModalOpen(false);
        await loadData();
      }
    } catch (err) {
      notify(err.message || 'Rollback failed', 'error');
    } finally {
      setRollingBack(false);
    }
  };

  // Product picker filtering
  const filteredCatalog = useMemo(() => {
    if (!productSearch) return catalogProducts.slice(0, 40);
    const q = productSearch.toLowerCase();
    return catalogProducts.filter(p => p.name.toLowerCase().includes(q) || p.unit?.toLowerCase().includes(q) || p.id.includes(q)).slice(0, 40);
  }, [catalogProducts, productSearch]);

  const addProductToList = (productId, targetList) => {
    if (targetList === 'bsPins') {
      const pins = draftConfig.bestSellers.pinnedProductIds || [];
      if (!pins.includes(productId)) updateDraftBestSellers('pinnedProductIds', [...pins, productId]);
    } else if (targetList === 'bsExclusions') {
      const ex = draftConfig.bestSellers.excludedProductIds || [];
      if (!ex.includes(productId)) updateDraftBestSellers('excludedProductIds', [...ex, productId]);
    } else if (targetList === 'bsFallback') {
      const fb = draftConfig.bestSellers.fallbackProductIds || [];
      if (!fb.includes(productId)) updateDraftBestSellers('fallbackProductIds', [...fb, productId]);
    } else if (targetList === 'tpPins') {
      const pins = draftConfig.topPicks.pinnedProductIds || [];
      if (!pins.includes(productId)) updateDraftTopPicks('pinnedProductIds', [...pins, productId]);
    } else if (targetList === 'tpCurated') {
      const cur = draftConfig.topPicks.curatedProductIds || [];
      if (!cur.includes(productId)) updateDraftTopPicks('curatedProductIds', [...cur, productId]);
    } else if (targetList === 'tpExclusions') {
      const ex = draftConfig.topPicks.excludedProductIds || [];
      if (!ex.includes(productId)) updateDraftTopPicks('excludedProductIds', [...ex, productId]);
    }
    setPickerModal({ open: false, mode: '', targetList: '' });
  };

  const removeProductFromList = (productId, targetList) => {
    if (targetList === 'bsPins') {
      updateDraftBestSellers('pinnedProductIds', (draftConfig.bestSellers.pinnedProductIds || []).filter(id => id !== productId));
    } else if (targetList === 'bsExclusions') {
      updateDraftBestSellers('excludedProductIds', (draftConfig.bestSellers.excludedProductIds || []).filter(id => id !== productId));
    } else if (targetList === 'bsFallback') {
      updateDraftBestSellers('fallbackProductIds', (draftConfig.bestSellers.fallbackProductIds || []).filter(id => id !== productId));
    } else if (targetList === 'tpPins') {
      updateDraftTopPicks('pinnedProductIds', (draftConfig.topPicks.pinnedProductIds || []).filter(id => id !== productId));
    } else if (targetList === 'tpCurated') {
      updateDraftTopPicks('curatedProductIds', (draftConfig.topPicks.curatedProductIds || []).filter(id => id !== productId));
    } else if (targetList === 'tpExclusions') {
      updateDraftTopPicks('excludedProductIds', (draftConfig.topPicks.excludedProductIds || []).filter(id => id !== productId));
    }
  };

  const getProductById = (id) => catalogProducts.find(p => p.id === id);

  if (loading) {
    return (
      <div className="admin-main">
        <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: 'var(--muted)' }}>
          <RefreshCw className="spin" size={32} />
          <p style={{ marginTop: 12 }}>Loading homepage ranking engine...</p>
        </div>
      </div>
    );
  }

  const bs = draftConfig?.bestSellers || {};
  const tp = draftConfig?.topPicks || {};

  return (
    <div className="admin-main proper-settings">
      {/* Top Header */}
      <div className="admin-title between" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#eaf7ef', color: 'var(--green)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              SUPER ADMIN ENGINE
            </span>
            <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              Live Version v{activeConfig?.version || 1}
            </span>
          </div>
          <h1 style={{ marginTop: 6 }}>Homepage Product Ranking</h1>
          <p>Super Admin authoritative discovery management for Best Sellers and Top Picks.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={openHistory} title="View publication history and rollback">
            <RotateCcw size={15} /> History & Rollback
          </button>
          <button className="btn btn-outline" onClick={handleSaveDraft} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn btn-primary" onClick={() => setPublishModalOpen(true)}>
            <Send size={15} /> Publish to Live
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="tabs admin-tabs" style={{ marginTop: 16 }}>
        <button className={activeTab === 'bestSellers' ? 'active' : ''} onClick={() => setActiveTab('bestSellers')}>
          <TrendingUp size={16} style={{ marginRight: 6 }} /> Best Sellers Configuration
        </button>
        <button className={activeTab === 'topPicks' ? 'active' : ''} onClick={() => setActiveTab('topPicks')}>
          <Sparkles size={16} style={{ marginRight: 6 }} /> Top Picks Discovery
        </button>
        <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>
          <Eye size={16} style={{ marginRight: 6 }} /> Live Ranking Preview
        </button>
      </div>

      {/* TAB 1: BEST SELLERS CONFIGURATION */}
      {activeTab === 'bestSellers' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Section Enable & Headers */}
          <div className="admin-card">
            <div className="card-head between">
              <div>
                <h3>Section Status & Storefront Headings</h3>
                <p>Control visibility, display text, and product capacity on the live storefront.</p>
              </div>
              <label className="switch-row" style={{ border: 0, padding: 0 }}>
                <span style={{ marginRight: 10, fontSize: 13, fontWeight: 700 }}>{bs.enabled ? 'Enabled' : 'Disabled'}</span>
                <input 
                  type="checkbox" 
                  checked={Boolean(bs.enabled)} 
                  onChange={e => updateDraftBestSellers('enabled', e.target.checked)} 
                />
                <i />
              </label>
            </div>

            <div className="form-grid" style={{ marginTop: 16 }}>
              <div>
                <label>Customer Heading</label>
                <input 
                  type="text" 
                  value={bs.title || ''} 
                  onChange={e => updateDraftBestSellers('title', e.target.value)} 
                  placeholder="e.g. Best Sellers" 
                />
              </div>
              <div>
                <label>Customer Subtitle</label>
                <input 
                  type="text" 
                  value={bs.subtitle || ''} 
                  onChange={e => updateDraftBestSellers('subtitle', e.target.value)} 
                  placeholder="e.g. Most popular grocery picks bought by our customers" 
                />
              </div>
              <div>
                <label>Display Product Count</label>
                <input 
                  type="number" 
                  min={3} 
                  max={30} 
                  value={bs.count || 10} 
                  onChange={e => updateDraftBestSellers('count', parseInt(e.target.value, 10))} 
                />
              </div>
              <div>
                <label>Stock Policy</label>
                <select 
                  value={bs.stockPolicy || 'IN_STOCK_ONLY'} 
                  onChange={e => updateDraftBestSellers('stockPolicy', e.target.value)}
                >
                  <option value="IN_STOCK_ONLY">In Stock Only (Strictly hide out-of-stock items)</option>
                  <option value="ALLOW_OUT_OF_STOCK">Allow Out of Stock (Keep visible, mark unavailable)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ranking Mode & Sales Period */}
          <div className="admin-card">
            <div className="card-head">
              <div>
                <h3>Sales Verification & Ranking Algorithm</h3>
                <p>Only verified completed or delivered orders (and delivered COD confirmations) are eligible.</p>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: 16 }}>
              <div>
                <label>Ranking Mode</label>
                <select 
                  value={bs.mode || 'WEIGHTED_SCORE'} 
                  onChange={e => updateDraftBestSellers('mode', e.target.value)}
                >
                  <option value="WEIGHTED_SCORE">Multi-Signal Weighted Score (Recommended)</option>
                  <option value="UNITS_SOLD">Units Sold (Net eligible quantity)</option>
                  <option value="ORDERS">Distinct Orders (Breadth of demand)</option>
                  <option value="REVENUE">Net Sales Revenue (Total gross)</option>
                  <option value="CATEGORY_RELATIVE">Category-Relative Performance (Cross-aisle balance)</option>
                </select>
              </div>

              <div>
                <label>Sales Measurement Period (Asia/Kolkata)</label>
                <select 
                  value={bs.periodDays || 30} 
                  onChange={e => updateDraftBestSellers('periodDays', parseInt(e.target.value, 10))}
                >
                  <option value={7}>Last 7 Days (Ultra Fast Velocity)</option>
                  <option value={30}>Last 30 Days (Standard Monthly)</option>
                  <option value={60}>Last 60 Days (Bi-Monthly Window)</option>
                  <option value={90}>Last 90 Days (Quarterly Volume)</option>
                </select>
              </div>
            </div>

            {/* Metric Weights Sliders if WEIGHTED_SCORE */}
            {bs.mode === 'WEIGHTED_SCORE' && (
              <div style={{ marginTop: 20, padding: '16px', background: '#f8faf9', borderRadius: 12, border: '1px solid #eef2ef' }}>
                <div className="between" style={{ marginBottom: 12 }}>
                  <b style={{ fontSize: 13 }}>Metric Weights Configuration</b>
                  <small style={{ color: 'var(--muted)' }}>Weights are normalized server-side. Total: 100%</small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Units Sold Norm:</span>
                      <b>{Math.round((bs.weights?.unitsSold || 0.35) * 100)}%</b>
                    </label>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={bs.weights?.unitsSold ?? 0.35} 
                      onChange={e => updateBsWeight('unitsSold', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Distinct Orders Norm:</span>
                      <b>{Math.round((bs.weights?.orderCount || 0.25) * 100)}%</b>
                    </label>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={bs.weights?.orderCount ?? 0.25} 
                      onChange={e => updateBsWeight('orderCount', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Net Revenue Norm:</span>
                      <b>{Math.round((bs.weights?.revenue || 0.20) * 100)}%</b>
                    </label>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={bs.weights?.revenue ?? 0.20} 
                      onChange={e => updateBsWeight('revenue', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Velocity Norm (Units/Week):</span>
                      <b>{Math.round((bs.weights?.velocity || 0.10) * 100)}%</b>
                    </label>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={bs.weights?.velocity ?? 0.10} 
                      onChange={e => updateBsWeight('velocity', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Trend Acceleration:</span>
                      <b>{Math.round((bs.weights?.trend || 0.10) * 100)}%</b>
                    </label>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={bs.weights?.trend ?? 0.10} 
                      onChange={e => updateBsWeight('trend', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Category-Relative Score:</span>
                      <b>{Math.round((bs.weights?.categoryRelative || 0.0) * 100)}%</b>
                    </label>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={bs.weights?.categoryRelative ?? 0.0} 
                      onChange={e => updateBsWeight('categoryRelative', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Thresholds */}
            <div className="form-grid" style={{ marginTop: 20 }}>
              <div>
                <label>Minimum Net Units Sold</label>
                <input 
                  type="number" min="1" 
                  value={bs.minUnits || 1} 
                  onChange={e => updateDraftBestSellers('minUnits', parseInt(e.target.value, 10))} 
                />
                <small style={{ color: 'var(--muted)' }}>Product must sell at least this many units in the window to qualify.</small>
              </div>

              <div>
                <label>Minimum Distinct Orders</label>
                <input 
                  type="number" min="1" 
                  value={bs.minOrders || 1} 
                  onChange={e => updateDraftBestSellers('minOrders', parseInt(e.target.value, 10))} 
                />
                <small style={{ color: 'var(--muted)' }}>Prevents single bulk orders from distorting ranking.</small>
              </div>

              <div>
                <label>Minimum Qualifying Products</label>
                <input 
                  type="number" min="1" max="20" 
                  value={bs.minQualifyingProducts || 3} 
                  onChange={e => updateDraftBestSellers('minQualifyingProducts', parseInt(e.target.value, 10))} 
                />
                <small style={{ color: 'var(--muted)' }}>If fewer products meet evidence thresholds, fallback behavior triggers.</small>
              </div>
            </div>
          </div>

          {/* Insufficient Sales Data & Honest Fallback */}
          <div className="admin-card" style={{ borderLeft: '4px solid var(--green)' }}>
            <div className="card-head">
              <div>
                <h3>Insufficient Sales Data & Honest Fallback Policy</h3>
                <p>Mandatory integrity check: Never fabricate sales data or show arbitrary products as proven Best Sellers.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: 10, borderRadius: 8, background: bs.fallbackBehavior === 'CURATED_FALLBACK' ? '#eaf7ef' : '#f8faf9' }}>
                <input 
                  type="radio" 
                  name="fallbackBehavior" 
                  value="CURATED_FALLBACK" 
                  checked={bs.fallbackBehavior === 'CURATED_FALLBACK'} 
                  onChange={e => updateDraftBestSellers('fallbackBehavior', e.target.value)} 
                  style={{ marginTop: 3 }}
                />
                <div>
                  <b style={{ fontSize: 13, color: 'var(--ink)' }}>Option B: Curated Fallback (Recommended)</b>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                    Show selected popular daily grocery essentials under a neutral customer heading (e.g. "Popular Picks"). Never falsely labeled as proven Best Sellers.
                  </p>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: 10, borderRadius: 8, background: bs.fallbackBehavior === 'HIDE' ? '#eaf7ef' : '#f8faf9' }}>
                <input 
                  type="radio" 
                  name="fallbackBehavior" 
                  value="HIDE" 
                  checked={bs.fallbackBehavior === 'HIDE'} 
                  onChange={e => updateDraftBestSellers('fallbackBehavior', e.target.value)} 
                  style={{ marginTop: 3 }}
                />
                <div>
                  <b style={{ fontSize: 13, color: 'var(--ink)' }}>Option A: Hide Cleanly</b>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                    Cleanly hide the section without leaving blank gaps until enough real customer orders pass qualification thresholds.
                  </p>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: 10, borderRadius: 8, background: bs.fallbackBehavior === 'WAIT' ? '#eaf7ef' : '#f8faf9' }}>
                <input 
                  type="radio" 
                  name="fallbackBehavior" 
                  value="WAIT" 
                  checked={bs.fallbackBehavior === 'WAIT'} 
                  onChange={e => updateDraftBestSellers('fallbackBehavior', e.target.value)} 
                  style={{ marginTop: 3 }}
                />
                <div>
                  <b style={{ fontSize: 13, color: 'var(--ink)' }}>Option C: Wait for Sufficient Evidence</b>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                    Section remains in standby state awaiting verified sales data before auto-publishing.
                  </p>
                </div>
              </label>
            </div>

            {/* Curated Fallback Configuration */}
            {bs.fallbackBehavior === 'CURATED_FALLBACK' && (
              <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div className="form-grid">
                  <div>
                    <label>Fallback Customer Heading</label>
                    <input 
                      type="text" 
                      value={bs.fallbackTitle || ''} 
                      onChange={e => updateDraftBestSellers('fallbackTitle', e.target.value)} 
                      placeholder="e.g. Popular Picks" 
                    />
                  </div>
                  <div>
                    <label>Fallback Subtitle</label>
                    <input 
                      type="text" 
                      value={bs.fallbackSubtitle || ''} 
                      onChange={e => updateDraftBestSellers('fallbackSubtitle', e.target.value)} 
                      placeholder="e.g. Handpicked daily essentials for your household" 
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className="between" style={{ marginBottom: 8 }}>
                    <label style={{ fontWeight: 700, fontSize: 12 }}>Curated Fallback Products ({(bs.fallbackProductIds || []).length})</label>
                    <button 
                      className="btn btn-outline" 
                      style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                      onClick={() => setPickerModal({ open: true, mode: 'fallback', targetList: 'bsFallback' })}
                    >
                      <Plus size={13} /> Add Products
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(bs.fallbackProductIds || []).map(pid => {
                      const p = getProductById(pid);
                      return (
                        <span key={pid} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#fff', border: '1px solid var(--line)', borderRadius: 20, fontSize: 12 }}>
                          {p?.image && <img src={p.image} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />}
                          <span>{p?.name || pid}</span>
                          <button onClick={() => removeProductFromList(pid, 'bsFallback')} style={{ padding: 0, color: 'var(--muted)', display: 'grid', placeItems: 'center' }}>
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                    {!(bs.fallbackProductIds || []).length && (
                      <p style={{ color: 'var(--muted)', fontSize: 12 }}>No fallback products selected. Please add items to show when sales thresholds aren't met.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Pins and Exclusions */}
          <div className="admin-card">
            <div className="card-head">
              <div>
                <h3>Manual Pins & Section Exclusions</h3>
                <p>Pins appear first in configured order. Excluded products never qualify regardless of sales volume.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 14 }}>
              {/* Manual Pins */}
              <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14, background: '#fafbfc' }}>
                <div className="between" style={{ marginBottom: 10 }}>
                  <b style={{ fontSize: 13 }}>Manually Pinned Placements ({(bs.pinnedProductIds || []).length})</b>
                  <button 
                    className="btn btn-outline" 
                    style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                    onClick={() => setPickerModal({ open: true, mode: 'pin', targetList: 'bsPins' })}
                  >
                    <Plus size={12} /> Add Pin
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  {(bs.pinnedProductIds || []).map((pid, idx) => {
                    const p = getProductById(pid);
                    return (
                      <div key={pid} className="between" style={{ padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #eef2ef', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: 11 }}>#{idx + 1}</span>
                          {p?.image && <img src={p.image} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} />}
                          <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || pid}</span>
                        </div>
                        <button onClick={() => removeProductFromList(pid, 'bsPins')} style={{ color: 'var(--muted)' }}><X size={14} /></button>
                      </div>
                    );
                  })}
                  {!(bs.pinnedProductIds || []).length && (
                    <small style={{ color: 'var(--muted)' }}>No manual pins set. Ranking is fully algorithmic.</small>
                  )}
                </div>
              </div>

              {/* Exclusions */}
              <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14, background: '#fafbfc' }}>
                <div className="between" style={{ marginBottom: 10 }}>
                  <b style={{ fontSize: 13 }}>Excluded from Best Sellers ({(bs.excludedProductIds || []).length})</b>
                  <button 
                    className="btn btn-outline" 
                    style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                    onClick={() => setPickerModal({ open: true, mode: 'exclude', targetList: 'bsExclusions' })}
                  >
                    <Plus size={12} /> Exclude
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  {(bs.excludedProductIds || []).map((pid) => {
                    const p = getProductById(pid);
                    return (
                      <div key={pid} className="between" style={{ padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #fee2e2', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 11 }}>EXCLUDED</span>
                          {p?.image && <img src={p.image} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} />}
                          <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || pid}</span>
                        </div>
                        <button onClick={() => removeProductFromList(pid, 'bsExclusions')} style={{ color: 'var(--muted)' }}><X size={14} /></button>
                      </div>
                    );
                  })}
                  {!(bs.excludedProductIds || []).length && (
                    <small style={{ color: 'var(--muted)' }}>No products excluded from ranking.</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP PICKS CONFIGURATION */}
      {activeTab === 'topPicks' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Status & Mode */}
          <div className="admin-card">
            <div className="card-head between">
              <div>
                <h3>Top Picks Section & Algorithmic Discovery</h3>
                <p>Personalized product suggestions combining algorithmic value scores, freshness, and editorial picks.</p>
              </div>
              <label className="switch-row" style={{ border: 0, padding: 0 }}>
                <span style={{ marginRight: 10, fontSize: 13, fontWeight: 700 }}>{tp.enabled ? 'Enabled' : 'Disabled'}</span>
                <input 
                  type="checkbox" 
                  checked={Boolean(tp.enabled)} 
                  onChange={e => updateDraftTopPicks('enabled', e.target.checked)} 
                />
                <i />
              </label>
            </div>

            <div className="form-grid" style={{ marginTop: 16 }}>
              <div>
                <label>Customer Heading</label>
                <input 
                  type="text" 
                  value={tp.title || ''} 
                  onChange={e => updateDraftTopPicks('title', e.target.value)} 
                  placeholder="e.g. Top Picks" 
                />
              </div>
              <div>
                <label>Customer Subtitle</label>
                <input 
                  type="text" 
                  value={tp.subtitle || ''} 
                  onChange={e => updateDraftTopPicks('subtitle', e.target.value)} 
                  placeholder="e.g. Daily essentials, seasonal favorites, and great value" 
                />
              </div>
              <div>
                <label>Discovery Mode</label>
                <select 
                  value={tp.mode || 'HYBRID'} 
                  onChange={e => updateDraftTopPicks('mode', e.target.value)}
                >
                  <option value="HYBRID">Hybrid (Pins first + Algorithmic ranking + Category diversity)</option>
                  <option value="ALGORITHMIC">100% Algorithmic (Multi-signal value & freshness scoring)</option>
                  <option value="CURATED">100% Curated (Super Admin handpicked products)</option>
                </select>
              </div>
              <div>
                <label>Display Product Count</label>
                <input 
                  type="number" min="3" max="30" 
                  value={tp.count || 10} 
                  onChange={e => updateDraftTopPicks('count', parseInt(e.target.value, 10))} 
                />
              </div>
            </div>

            {/* Diversity and Stock switches */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={tp.diversityEnabled !== false} 
                  onChange={e => updateDraftTopPicks('diversityEnabled', e.target.checked)} 
                />
                <div>
                  <b style={{ fontSize: 13 }}>Category Diversity Constraint</b>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Caps max 3 items from any single category in top positions.</p>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={tp.stockPolicy === 'ALLOW_OUT_OF_STOCK'} 
                  onChange={e => updateDraftTopPicks('stockPolicy', e.target.checked ? 'ALLOW_OUT_OF_STOCK' : 'IN_STOCK_ONLY')} 
                />
                <div>
                  <b style={{ fontSize: 13 }}>Include Out-of-Stock Items</b>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Display items with 'Out of Stock' badge rather than omitting.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Algorithmic Weights if HYBRID or ALGORITHMIC */}
          {(tp.mode === 'HYBRID' || tp.mode === 'ALGORITHMIC') && (
            <div className="admin-card">
              <div className="card-head">
                <div>
                  <h3>Algorithmic Discovery Signals & Multi-Factor Weights</h3>
                  <p>Balances customer value discounts, stock availability, product launch freshness, and sales signals.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sales Performance:</span>
                    <b>{Math.round((tp.weights?.salesPerformance || 0.25) * 100)}%</b>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={tp.weights?.salesPerformance ?? 0.25} 
                    onChange={e => updateTpWeight('salesPerformance', e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Value / Discount Score:</span>
                    <b>{Math.round((tp.weights?.valueScore || 0.20) * 100)}%</b>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={tp.weights?.valueScore ?? 0.20} 
                    onChange={e => updateTpWeight('valueScore', e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stock Availability:</span>
                    <b>{Math.round((tp.weights?.availabilityScore || 0.20) * 100)}%</b>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={tp.weights?.availabilityScore ?? 0.20} 
                    onChange={e => updateTpWeight('availabilityScore', e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Launch Freshness:</span>
                    <b>{Math.round((tp.weights?.freshnessScore || 0.15) * 100)}%</b>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={tp.weights?.freshnessScore ?? 0.15} 
                    onChange={e => updateTpWeight('freshnessScore', e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Trend Velocity:</span>
                    <b>{Math.round((tp.weights?.trendScore || 0.10) * 100)}%</b>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={tp.weights?.trendScore ?? 0.10} 
                    onChange={e => updateTpWeight('trendScore', e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Category Diversity Factor:</span>
                    <b>{Math.round((tp.weights?.diversityScore || 0.10) * 100)}%</b>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={tp.weights?.diversityScore ?? 0.10} 
                    onChange={e => updateTpWeight('diversityScore', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Curated or Pinned selections */}
          <div className="admin-card">
            <div className="card-head">
              <div>
                <h3>{tp.mode === 'CURATED' ? 'Curated Products Selection' : 'Pinned Highlights & Labels'}</h3>
                <p>Assign customer-facing badges like 'Daily Essentials', 'Great Value', or 'Staff Picks'.</p>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="between" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 13 }}>
                  {tp.mode === 'CURATED' ? `Curated Products (${(tp.curatedProductIds || []).length})` : `Pinned Products (${(tp.pinnedProductIds || []).length})`}
                </b>
                <button 
                  className="btn btn-outline" 
                  style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                  onClick={() => setPickerModal({ open: true, mode: tp.mode === 'CURATED' ? 'curated' : 'pin', targetList: tp.mode === 'CURATED' ? 'tpCurated' : 'tpPins' })}
                >
                  <Plus size={12} /> Add Product
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {(tp.mode === 'CURATED' ? (tp.curatedProductIds || []) : (tp.pinnedProductIds || [])).map(pid => {
                  const p = getProductById(pid);
                  const currentLabel = tp.labels?.[pid] || 'Daily Essentials';
                  return (
                    <div key={pid} className="between" style={{ padding: '8px 12px', background: '#fafbfc', borderRadius: 8, border: '1px solid #eef2ef', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p?.image && <img src={p.image} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />}
                        <div style={{ maxWidth: 130 }}>
                          <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || pid}</b>
                          <small style={{ color: 'var(--muted)' }}>₹{p?.price}</small>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select 
                          style={{ fontSize: 11, padding: '4px 6px' }}
                          value={currentLabel}
                          onChange={e => {
                            const newLabels = { ...(tp.labels || {}), [pid]: e.target.value };
                            updateDraftTopPicks('labels', newLabels);
                          }}
                        >
                          <option value="Daily Essentials">Daily Essentials</option>
                          <option value="Great Value">Great Value</option>
                          <option value="Seasonal Favourites">Seasonal Favourites</option>
                          <option value="Staff Picks">Staff Picks</option>
                        </select>
                        <button onClick={() => removeProductFromList(pid, tp.mode === 'CURATED' ? 'tpCurated' : 'tpPins')} style={{ color: 'var(--muted)' }}><X size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE RANKING PREVIEW */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Target Toggle */}
          <div className="admin-card between" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Preview Configuration:</span>
              <div className="segmented">
                <button 
                  className={previewTarget === 'draft' ? 'active' : ''} 
                  onClick={() => setPreviewTarget('draft')}
                >
                  Unpublished Draft
                </button>
                <button 
                  className={previewTarget === 'active' ? 'active' : ''} 
                  onClick={() => setPreviewTarget('active')}
                >
                  Active Live Storefront
                </button>
              </div>
            </div>

            <button className="btn btn-outline" style={{ height: 32 }} onClick={() => fetchPreview(previewTarget)} disabled={previewLoading}>
              <RefreshCw size={13} className={previewLoading ? 'spin' : ''} /> Refresh Preview
            </button>
          </div>

          {/* Best Sellers Preview Section */}
          <div className="admin-card">
            <div className="card-head between">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3>Best Sellers Preview</h3>
                  {previewData?.bestSellers?.type === 'curated_fallback' && (
                    <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                      CURATED FALLBACK ACTIVE
                    </span>
                  )}
                  {previewData?.bestSellers?.type === 'best_sellers' && (
                    <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                      PROVEN SALES RANKED
                    </span>
                  )}
                </div>
                <p>
                  Heading: "{previewData?.bestSellers?.title}" · {previewData?.bestSellers?.products?.length || 0} products displayed
                </p>
              </div>
            </div>

            {previewData?.bestSellers?.type === 'curated_fallback' && (
              <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, color: '#92400e', margin: '10px 0 16px' }}>
                <AlertTriangle size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                <b>Honest Fallback Triggered:</b> Qualifying products from verified delivered orders did not meet the minimum qualifying threshold ({draftConfig?.bestSellers?.minQualifyingProducts || 3}). The storefront honestly serves curated items with neutral title "{previewData?.bestSellers?.title}" without falsely claiming them to be proven Best Sellers.
              </div>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Placement Type</th>
                    <th>Score / Units</th>
                    <th>Inclusion Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewData?.bestSellers?.products || []).map((p, idx) => (
                    <tr key={p.id}>
                      <td><b style={{ color: 'var(--green)' }}>#{p.rank || idx + 1}</b></td>
                      <td>
                        <div className="product-cell">
                          <img src={p.image} alt="" />
                          <span>
                            <b>{p.name}</b>
                            <small>{p.unit} · {p.categoryName}</small>
                          </span>
                        </div>
                      </td>
                      <td><b>₹{p.price}</b> <small style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>₹{p.mrp}</small></td>
                      <td>
                        <span className={`badge badge-${p.stock > 0 ? 'green' : 'red'}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12, 
                          background: p.rankingType === 'PINNED' ? '#eff6ff' : (p.rankingType === 'FALLBACK' ? '#fff7ed' : '#ecfdf5'),
                          color: p.rankingType === 'PINNED' ? '#1d4ed8' : (p.rankingType === 'FALLBACK' ? '#c2410c' : '#047857')
                        }}>
                          {p.rankingType || 'ALGORITHMIC'}
                        </span>
                      </td>
                      <td>
                        {p.score !== undefined ? (
                          <span>
                            <b>{p.score} pts</b>
                            <small>{p.unitsSold || 0} units · {p.distinctOrders || 0} orders</small>
                          </span>
                        ) : (
                          <span>Curated Pick</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {p.reason || 'Qualified via eligible delivered orders'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!(previewData?.bestSellers?.products || []).length && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                        Section is hidden or no eligible products available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Picks Preview Section */}
          <div className="admin-card">
            <div className="card-head">
              <div>
                <h3>Top Picks Preview</h3>
                <p>Heading: "{previewData?.topPicks?.title}" · Mode: {previewData?.topPicks?.mode} · {previewData?.topPicks?.products?.length || 0} products</p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Badge Label</th>
                    <th>Algorithmic Score</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewData?.topPicks?.products || []).map((p, idx) => (
                    <tr key={p.id}>
                      <td><b style={{ color: 'var(--green)' }}>#{p.rank || idx + 1}</b></td>
                      <td>
                        <div className="product-cell">
                          <img src={p.image} alt="" />
                          <span>
                            <b>{p.name}</b>
                            <small>{p.unit} · {p.categoryName}</small>
                          </span>
                        </div>
                      </td>
                      <td><b>₹{p.price}</b></td>
                      <td>
                        <span className={`badge badge-${p.stock > 0 ? 'green' : 'red'}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12 }}>
                          {p.topPickLabel || 'Daily Essentials'}
                        </span>
                      </td>
                      <td>
                        <b>{p.score !== undefined ? `${p.score} pts` : 'Curated'}</b>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: '#475569' }}>{p.reason || 'Multi-signal ranking match'}</span>
                      </td>
                    </tr>
                  ))}
                  {!(previewData?.topPicks?.products || []).length && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                        Section is hidden or empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH CONFIRMATION MODAL */}
      {publishModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 500, padding: 24, borderRadius: 16 }}>
            <div className="modal-head" style={{ border: 0, padding: 0, marginBottom: 16 }}>
              <h3>Publish Homepage Ranking</h3>
              <button onClick={() => setPublishModalOpen(false)}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <p>You are about to publish the current draft ranking configuration to the live storefront.</p>
              <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
                <li>New version number will be assigned: <b>v{(activeConfig?.version || 1) + 1}</b></li>
                <li>Live homepage Best Sellers and Top Picks will immediately recalculate.</li>
                <li>Prior active configuration will be archived in history for instant rollback.</li>
              </ul>

              <label style={{ display: 'block', marginTop: 14, fontWeight: 700 }}>
                Audit Change Note (Optional):
              </label>
              <input 
                type="text" 
                value={publishNote} 
                onChange={e => setPublishNote(e.target.value)} 
                placeholder="e.g. Adjusted 30-day sales weights and fallback items" 
                style={{ width: '100%', marginTop: 6 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button className="btn btn-outline" onClick={() => setPublishModalOpen(false)} disabled={publishing}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY & ROLLBACK MODAL */}
      {historyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 650, padding: 24, borderRadius: 16, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-head" style={{ border: 0, padding: 0, marginBottom: 16 }}>
              <h3>Publication History & Instant Rollback</h3>
              <button onClick={() => setHistoryModalOpen(false)}><X size={18} /></button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -6, marginBottom: 16 }}>
              Every published version is preserved in TiDB with complete ranking weights, pins, and fallbacks.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              {historyList.map(item => (
                <div key={item.id} className="between" style={{ padding: '12px 14px', background: '#f8faf9', border: '1px solid var(--line)', borderRadius: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ color: 'var(--green)', fontSize: 13 }}>Version v{item.version}</b>
                      <small style={{ color: 'var(--muted)' }}>
                        {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </small>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#334155' }}>
                      {item.note || 'No change description provided'}
                    </p>
                    <small style={{ color: 'var(--muted)' }}>By: {item.publishedBy || 'Super Admin'}</small>
                  </div>

                  <button 
                    className="btn btn-outline" 
                    style={{ height: 30, fontSize: 11 }}
                    onClick={() => handleRollback(item.version)}
                    disabled={rollingBack}
                  >
                    <RotateCcw size={12} /> Rollback to this
                  </button>
                </div>
              ))}
              {!historyList.length && (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 12 }}>
                  No historical versions recorded yet. Publications will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT PICKER MODAL */}
      {pickerModal.open && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 560, padding: 20, borderRadius: 16, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head between" style={{ border: 0, padding: 0, marginBottom: 12 }}>
              <h3>Select Product from Catalog</h3>
              <button onClick={() => setPickerModal({ open: false, mode: '', targetList: '' })}><X size={18} /></button>
            </div>

            <div className="search-box" style={{ margin: '8px 0 14px' }}>
              <Search size={18} />
              <input 
                type="text" 
                value={productSearch} 
                onChange={e => setProductSearch(e.target.value)} 
                placeholder="Search products by name or unit..." 
                autoFocus 
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 4 }}>
              {filteredCatalog.map(p => (
                <div key={p.id} className="between" style={{ padding: '8px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.images?.[0]?.url && (
                      <img src={p.images[0].url} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} />
                    )}
                    <div>
                      <b style={{ display: 'block' }}>{p.name}</b>
                      <small style={{ color: 'var(--muted)' }}>{p.unit} · ₹{p.price} · {p.stock} in stock</small>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                    onClick={() => addProductToList(p.id, pickerModal.targetList)}
                  >
                    Select
                  </button>
                </div>
              ))}
              {!filteredCatalog.length && (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: 12 }}>No matching products found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
