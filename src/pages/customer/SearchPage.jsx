import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  History,
  X,
  Flame,
  ArrowRight,
  Sparkles,
  Check,
  Package,
  Zap,
  ShoppingBag,
  AlertCircle,
  PackageX,
  Lightbulb,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { EmptyState, ProductGrid, money } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { customerService } from '../../services/customer.service';
import { catalogService } from '../../services/catalog.service';
import { dedupeProductPacks } from '../../utils/products';

const TRENDING_SEARCHES = [
  'Milk',
  'Chips & Namkeen',
  'Cold Drinks',
  'Atta & Rice',
  'Biscuits & Cookies',
  'Tea & Coffee',
  'Fresh Veggies',
  'Paneer'
];

export function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, notify, categories, products, activeDeliveryRules, deliveryConfig, storeSettings } = useApp();
  const initialQuery = new URLSearchParams(location.search).get('q') || '';

  const [q, setQ] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);
  const [recent, setRecent] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('popular');
  const [available, setAvailable] = useState(false);

  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const rules = activeDeliveryRules || deliveryConfig;
  const eta = rules?.estimatedDelivery || '15–20 mins';
  const effectiveStatus = storeSettings?.effectiveStatus;
  const isEmergencyPaused = Boolean(
    storeSettings?.policies?.emergencyPause?.isPaused ||
    storeSettings?.isOrderPaused ||
    effectiveStatus?.storeStatus === 'EMERGENCY_PAUSED'
  );
  const isStoreFullyClosed = Boolean(
    effectiveStatus?.storeStatus === 'CLOSED' ||
    (effectiveStatus?.allowImmediateOrders === false && effectiveStatus?.allowScheduledOrders === false)
  );
  const isInstantClosed = Boolean(
    isEmergencyPaused ||
    isStoreFullyClosed ||
    effectiveStatus?.storeStatus === 'SCHEDULED_ONLY' ||
    effectiveStatus?.allowImmediateOrders === false
  );
  const isPaused = Boolean(rules?.isPaused || isEmergencyPaused);
  const isClosed = Boolean(isStoreFullyClosed || isInstantClosed);

  // Sync initial query from URL
  useEffect(() => {
    const urlQ = new URLSearchParams(location.search).get('q') || '';
    if (urlQ !== q) {
      setQ(urlQ);
      setDebouncedQ(urlQ);
    }
  }, [location.search]);

  // Debounce query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      const trimmed = q.trim();
      const currentUrlQ = new URLSearchParams(window.location.search).get('q') || '';
      if (trimmed !== currentUrlQ) {
        const newUrl = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search';
        navigate(newUrl, { replace: true });
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [q, navigate]);

  // Load search history
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let history = user
          ? await customerService.searchHistory()
          : JSON.parse(localStorage.getItem('r2cart-search-history') || '[]');
        const query = initialQuery.trim();
        if (query.length >= 2) {
          if (user) await customerService.saveSearch(query).catch(() => {});
          history = [query, ...history.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
          if (!user) localStorage.setItem('r2cart-search-history', JSON.stringify(history));
        }
        if (active) setRecent(history);
      } catch (error) {
        if (active && notify) notify(error.message, 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [user, initialQuery]);

  // Execute Smart Search on backend
  useEffect(() => {
    let active = true;
    const trimmed = debouncedQ.trim();

    if (!trimmed) {
      setSearchData(null);
      setLoading(false);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);

    catalogService
      .searchProducts(trimmed, {
        category,
        available,
        sort
      })
      .then((res) => {
        if (!active) return;
        setSearchData(res);
        setLoading(false);

        // Save to recent search history
        if (trimmed.length >= 2) {
          setRecent((items) => {
            const next = [trimmed, ...items.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
            if (!user) localStorage.setItem('r2cart-search-history', JSON.stringify(next));
            return next;
          });
          if (user) customerService.saveSearch(trimmed).catch(() => {});
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Backend search error, using local fallback:', err.message);
        // Fallback to local products
        const localMatches = products.filter((p) => {
          const matchQ = p.name.toLowerCase().includes(trimmed.toLowerCase());
          const matchCat = category === 'all' || p.category === category;
          const matchStock = !available || p.stock > 0;
          return matchQ && matchCat && matchStock;
        });

        setSearchData({
          query: trimmed,
          scenario: localMatches.length ? 'PARTIAL_MATCHES' : 'NOT_FOUND',
          exactProduct: null,
          results: localMatches,
          similarProducts: [],
          suggestions: [],
          total: localMatches.length,
          inStockCount: localMatches.filter((p) => p.stock > 0).length
        });
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQ, category, sort, available, user, products]);

  const handleSearchSubmit = (val) => {
    const query = (val || q).trim();
    setQ(query);
  };

  const removeRecent = async (val, e) => {
    e.stopPropagation();
    try {
      const next = recent.filter((item) => item !== val);
      if (user) await customerService.removeSearch(val);
      else localStorage.setItem('r2cart-search-history', JSON.stringify(next));
      setRecent(next);
    } catch {}
  };

  const clearRecent = async () => {
    try {
      if (user) await customerService.clearSearchHistory();
      else localStorage.removeItem('r2cart-search-history');
      setRecent([]);
      if (notify) notify('Search history cleared');
    } catch {}
  };

  const handleApplySuggestion = (suggestion) => {
    setQ(suggestion);
    handleSearchSubmit(suggestion);
  };

  const handleClearSearch = () => {
    setQ('');
    setSearchData(null);
    navigate('/search', { replace: true });
  };

  const scenario = searchData?.scenario || 'PARTIAL_MATCHES';
  const results = dedupeProductPacks(searchData?.results || []);
  const exactProduct = searchData?.exactProduct;
  const similarProducts = dedupeProductPacks(searchData?.similarProducts || []);
  const suggestions = searchData?.suggestions || [];
  const isSearchActive = Boolean(debouncedQ.trim());

  return (
    <>
      <style>{`
        .search-page-wrapper {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 14px 80px;
          box-sizing: border-box;
          width: 100%;
        }

        .search-header-box {
          background: #ffffff;
          border-radius: 16px;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
          padding: 8px 12px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-sizing: border-box;
          width: 100%;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .search-header-box:focus-within {
          border-color: #059669;
          box-shadow: 0 6px 22px rgba(5, 150, 105, 0.12), 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .search-input-field {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          font-weight: 500;
          font-family: inherit;
          color: #0f172a;
          background: transparent;
          min-width: 0;
        }

        .search-input-field::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .search-clear-btn {
          background: #f1f5f9;
          border: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .search-clear-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .search-submit-btn {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .search-submit-btn:hover {
          background: #047857;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .search-submit-btn:active {
          transform: scale(0.96);
        }

        @media (max-width: 820px) {
          .search-page-wrapper {
            padding: 10px 12px 85px;
          }

          .search-header-box {
            position: sticky;
            top: 58px;
            z-index: 45;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(12px);
            padding: 7px 10px;
            margin-bottom: 12px;
            border-radius: 14px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          }

          .search-input-field {
            font-size: 14px;
          }

          .search-submit-btn {
            padding: 7px 12px;
            font-size: 12.5px;
          }
        }

        .discovery-card-v2 {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .search-chip-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .search-chip-item:hover {
          border-color: #059669;
          background: #f0fdf4;
          color: #059669;
        }

        .search-category-tile {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          color: #1e293b;
          transition: all 0.15s ease;
        }

        .search-category-tile:hover {
          border-color: #a7f3d0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08);
        }

        .filter-toolbar-v2 {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-sizing: border-box;
          width: 100%;
        }

        .cat-scroll-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 0;
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .cat-scroll-pills::-webkit-scrollbar {
          display: none;
        }

        .cat-scroll-pill {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .cat-scroll-pill:hover {
          border-color: #a7f3d0;
          color: #059669;
        }

        .cat-scroll-pill.active {
          border-color: #059669;
          background: #f0fdf4;
          color: #059669;
          box-shadow: 0 0 0 1px #059669;
        }

        .toggle-stock-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .toggle-stock-pill.active {
          border-color: #059669;
          background: #ecfdf5;
          color: #059669;
        }

        .sort-select-v2 {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          background: #f8fafc;
          outline: none;
          cursor: pointer;
        }

        /* Unavailable Product Banner (Case 3) */
        .unavailable-hero-card {
          background: #fff;
          border: 1.5px solid #fecaca;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.06);
        }

        .unavailable-banner-top {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid #fee2e2;
          margin-bottom: 14px;
        }

        .unavailable-banner-top svg {
          color: #dc2626;
          flex-shrink: 0;
        }

        .unavailable-item-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fef2f2;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .unavailable-item-thumb {
          width: 58px;
          height: 58px;
          object-fit: cover;
          border-radius: 10px;
          background: #fff;
          border: 1px solid #fecaca;
        }

        .suggestion-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .suggestion-pill-badge:hover {
          background: #059669;
          color: #fff;
        }

        /* Loading Skeleton */
        .search-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }

        .search-skeleton-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.9; }
          100% { opacity: 0.6; }
        }
      `}</style>

      <div className="search-page-wrapper">
        {/* Top Floating Search Bar */}
        <div className="search-header-box">
          <Search size={18} color="#059669" strokeWidth={2.2} style={{ flexShrink: 0 }} />
          <input
            type="text"
            className="search-input-field"
            placeholder='Search for "milk", "bread", "chips", "paneer"...'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            autoFocus={!initialQuery}
          />
          {q && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear text"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            className="search-submit-btn"
            onClick={() => handleSearchSubmit()}
          >
            Search
          </button>
        </div>

        {/* Discovery Sections when search input is empty */}
        {!isSearchActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {/* Recent Searches */}
            {recent.length > 0 && (
              <div className="discovery-card-v2">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={16} color="#059669" />
                    <b style={{ fontSize: '13px', color: '#0f172a' }}>Recent Searches</b>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecent}
                    style={{ background: 'none', border: 'none', fontSize: '11.5px', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear all
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {recent.map((item) => (
                    <span
                      key={item}
                      className="search-chip-item"
                      onClick={() => {
                        setQ(item);
                        handleSearchSubmit(item);
                      }}
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={(e) => removeRecent(item, e)}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                        aria-label={`Remove ${item}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div className="discovery-card-v2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Flame size={16} color="#f97316" />
                <b style={{ fontSize: '13px', color: '#0f172a' }}>Trending Searches</b>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {TRENDING_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="search-chip-item"
                    onClick={() => {
                      setQ(item);
                      handleSearchSubmit(item);
                    }}
                  >
                    <Sparkles size={11} color="#f59e0b" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Categories Grid */}
            <div className="discovery-card-v2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <b style={{ fontSize: '13px', color: '#0f172a' }}>Browse Categories</b>
                <Link
                  to={`/category/${categories[0]?.slug || 'fruits-vegetables'}`}
                  style={{ fontSize: '11.5px', color: '#059669', textDecoration: 'none', fontWeight: 700 }}
                >
                  View all
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                {categories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/category/${cat.slug}`}
                    className="search-category-tile"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: '42px', height: '42px', objectFit: 'contain', marginBottom: '6px' }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.2 }}>
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter & Sort Toolbar (Visible whenever a search is typed or category is chosen) */}
        {isSearchActive && (
          <div className="filter-toolbar-v2">
            {/* Row 1: Category Chips Scroll */}
            <div className="cat-scroll-pills">
              <button
                type="button"
                className={`cat-scroll-pill ${category === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all')}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  className={`cat-scroll-pill ${category === cat.slug ? 'active' : ''}`}
                  onClick={() => setCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Row 2: In Stock & Sort Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingTop: '8px',
                borderTop: '1px solid #f1f5f9',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <button
                type="button"
                className={`toggle-stock-pill ${available ? 'active' : ''}`}
                onClick={() => setAvailable((v) => !v)}
              >
                <Zap size={13} color={available ? '#059669' : '#64748b'} />
                <span>In Stock Only</span>
                {available && <Check size={12} strokeWidth={3} />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="sort-select-v2"
                >
                  <option value="popular">Relevance / Popular</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #059669', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              <span>Searching real products for “{debouncedQ}”…</span>
            </div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            <div className="search-skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="search-skeleton-card">
                  <div style={{ width: '100%', height: '110px', background: '#f1f5f9', borderRadius: '10px', marginBottom: '10px' }} />
                  <div style={{ width: '60%', height: '12px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ width: '85%', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ width: '40%', height: '16px', background: '#f1f5f9', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Area (when not loading) */}
        {!loading && isSearchActive && (
          <>
            {/* ============================================================== */}
            {/* CASE 3: Exact Product Not Available, but Related Products Exist */}
            {/* ============================================================== */}
            {scenario === 'EXACT_UNAVAILABLE' && exactProduct && (
              <div className="unavailable-hero-card">
                <div className="unavailable-banner-top">
                  <PackageX size={24} />
                  <div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#991b1b', margin: '0 0 2px' }}>
                      Sorry, this product is currently unavailable.
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#b91c1c', margin: 0 }}>
                      The requested item is out of stock. We found similar available products you can order right now.
                    </p>
                  </div>
                </div>

                {/* The Out-of-Stock Product Card */}
                <div className="unavailable-item-preview">
                  {exactProduct.image && (
                    <img
                      src={exactProduct.image}
                      alt={exactProduct.name}
                      className="unavailable-item-thumb"
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: '14px', color: '#1e293b', display: 'block' }}>
                      {exactProduct.name}
                    </b>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {exactProduct.unit} · {money(exactProduct.price)}
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#dc2626',
                          background: '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        Out of stock
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    style={{
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      border: '1px solid #cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'not-allowed'
                    }}
                  >
                    Unavailable
                  </button>
                </div>

                {/* Similar Products You May Like */}
                {similarProducts.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div>
                        <b style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
                          Similar Products You May Like
                        </b>
                        <small style={{ fontSize: '12px', color: isClosed || isPaused ? '#d97706' : '#059669', fontWeight: 600 }}>
                          {isClosed || isPaused ? '⚡ In stock · Available for scheduled delivery' : `⚡ In stock & ready for delivery in ${eta}`}
                        </small>
                      </div>
                    </div>
                    <ProductGrid items={similarProducts} />
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* CASE 1 & 4: Exact Product Available OR Partial Search Matches  */}
            {/* ============================================================== */}
            {(scenario === 'EXACT_AVAILABLE' || scenario === 'PARTIAL_MATCHES') && results.length > 0 && (
              <>
                {/* Result Count Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#475569' }}>
                    Showing <b style={{ color: '#0f172a' }}>{results.length}</b> {scenario === 'EXACT_AVAILABLE' ? 'matching product' : 'products'} for{' '}
                    <b style={{ color: '#059669' }}>“{debouncedQ}”</b>
                  </span>

                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear filter
                  </button>
                </div>

                {/* Primary Matching Product Grid */}
                <ProductGrid items={results} />

                {/* Similar Products You May Like (if available and different from results) */}
                {similarProducts.length > 0 && (
                  <section style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '14px' }}>
                      <b style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
                        More from {similarProducts[0]?.categoryName || 'this category'}
                      </b>
                      <small style={{ fontSize: '12px', color: '#64748b' }}>
                        Customers also viewed these related items
                      </small>
                    </div>
                    <ProductGrid items={similarProducts} />
                  </section>
                )}
              </>
            )}

            {/* ============================================================== */}
            {/* CASE 2: Product Not Found                                      */}
            {/* ============================================================== */}
            {(scenario === 'NOT_FOUND' || (results.length === 0 && scenario !== 'EXACT_UNAVAILABLE')) && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                  margin: '10px 0 24px'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#64748b'
                  }}
                >
                  <Search size={30} strokeWidth={2} />
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Product not found
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    margin: '0 auto 20px',
                    maxWidth: '400px',
                    lineHeight: 1.5
                  }}
                >
                  Sorry, we couldn't find this product. Try another name or explore similar products.
                </p>

                {/* Suggestions / Typo Corrections */}
                {suggestions.length > 0 && (
                  <div style={{ marginBottom: '22px' }}>
                    <small style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                      💡 Did you mean:
                    </small>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className="suggestion-pill-badge"
                          onClick={() => handleApplySuggestion(sug)}
                        >
                          <Sparkles size={11} />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons: Clear search and Explore Categories */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: similarProducts.length ? '28px' : '0' }}>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#f1f5f9',
                      color: '#334155',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Clear Search</span>
                  </button>

                  <Link
                    to={`/category/${categories[0]?.slug || 'fruits-vegetables'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#059669',
                      color: '#ffffff',
                      padding: '10px 22px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <span>Explore Categories</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </Link>
                </div>

                {/* Related or Similar Grocery Products if suitable alternatives can be inferred */}
                {similarProducts.length > 0 && (
                  <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <div style={{ marginBottom: '14px' }}>
                      <b style={{ fontSize: '15.5px', color: '#0f172a', display: 'block' }}>
                        Similar Products You May Like
                      </b>
                      <small style={{ fontSize: '12px', color: '#64748b' }}>
                        Real products from our grocery catalogue
                      </small>
                    </div>
                    <ProductGrid items={similarProducts} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
