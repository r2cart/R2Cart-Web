import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  History,
  X,
  Flame,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Check,
  Package,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { EmptyState, ProductGrid, money } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { customerService } from '../../services/customer.service';

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
  const { user, notify, categories, products, activeDeliveryRules, deliveryConfig } = useApp();
  const initialQuery = new URLSearchParams(location.search).get('q') || '';

  const [q, setQ] = useState(initialQuery);
  const [recent, setRecent] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('popular');
  const [available, setAvailable] = useState(false);

  const rules = activeDeliveryRules || deliveryConfig;
  const eta = rules?.estimatedDelivery || '15–20 mins';

  // Load search history
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let history = user
          ? await customerService.searchHistory()
          : JSON.parse(localStorage.getItem('grocify-search-history') || '[]');
        const query = initialQuery.trim();
        setQ(query);
        if (query.length >= 2) {
          if (user) await customerService.saveSearch(query);
          history = [query, ...history.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
          if (!user) localStorage.setItem('grocify-search-history', JSON.stringify(history));
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

  // Results filtering & sorting
  const result = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = products.filter((product) => {
      const catName = categories.find((item) => item.slug === product.category)?.name?.toLowerCase() || '';
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        catName.includes(query) ||
        (product.description && product.description.toLowerCase().includes(query));

      const matchesCat = category === 'all' || product.category === category;
      const matchesStock = !available || product.stock > 0;

      return matchesQuery && matchesCat && matchesStock;
    });

    if (sort === 'low') rows = [...rows].sort((a, b) => a.price - b.price);
    if (sort === 'high') rows = [...rows].sort((a, b) => b.price - a.price);
    if (sort === 'discount') rows = [...rows].sort((a, b) => (b.mrp - b.price) - (a.mrp - a.price));

    return rows;
  }, [q, category, sort, available, products, categories]);

  // Related category items
  const related = useMemo(() => {
    const query = q.trim().toLowerCase();
    const matched = products.find((product) => product.name.toLowerCase().includes(query));
    if (!query || !matched) return null;
    const ids = new Set(result.map((product) => product.id));
    const items = products.filter((product) => product.category === matched.category && !ids.has(product.id));
    return items.length ? { category: categories.find((item) => item.slug === matched.category), items } : null;
  }, [q, result, products, categories]);

  const handleSearchSubmit = (val) => {
    const query = (val || q).trim();
    if (query.length < 2) return;
    setQ(query);
    setRecent((items) => {
      const next = [query, ...items.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
      if (!user) localStorage.setItem('grocify-search-history', JSON.stringify(next));
      return next;
    });
    if (user) customerService.saveSearch(query).catch(() => {});
  };

  const removeRecent = async (val, e) => {
    e.stopPropagation();
    try {
      const next = recent.filter((item) => item !== val);
      if (user) await customerService.removeSearch(val);
      else localStorage.setItem('grocify-search-history', JSON.stringify(next));
      setRecent(next);
    } catch {}
  };

  const clearRecent = async () => {
    try {
      if (user) await customerService.clearSearchHistory();
      else localStorage.removeItem('grocify-search-history');
      setRecent([]);
      if (notify) notify('Search history cleared');
    } catch {}
  };

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
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          padding: 12px 14px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-sizing: border-box;
          width: 100%;
        }

        .search-input-field {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14.5px;
          font-family: inherit;
          color: #0f172a;
          background: transparent;
        }

        .search-input-field::placeholder {
          color: #94a3b8;
        }

        .search-clear-btn {
          background: #f1f5f9;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .search-clear-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .search-submit-btn {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .search-submit-btn:hover {
          background: #047857;
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
      `}</style>

      <div className="search-page-wrapper">
        {/* Top Floating Search Bar */}
        <form
          className="search-header-box"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit();
          }}
        >
          <Search size={20} color="#059669" style={{ flexShrink: 0 }} />

          <input
            type="text"
            className="search-input-field"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for milk, chips, atta, fruits, snacks…"
            autoFocus={!initialQuery}
          />

          {q && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setQ('');
                setCategory('all');
              }}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}

          <button type="submit" className="search-submit-btn">
            Search
          </button>
        </form>

        {/* Discovery Sections when search query is empty */}
        {!q.trim() && (
          <div>
            {/* Recent Searches */}
            {recent.length > 0 && (
              <div className="discovery-card-v2">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={16} color="#059669" />
                    <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Recent Searches</b>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecent}
                    style={{ background: 'none', border: 'none', color: '#059669', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}
                        aria-label="Remove"
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
                <Flame size={16} color="#ea580c" />
                <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Trending Searches</b>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                    <Sparkles size={12} color="#f59e0b" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Categories Grid */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <b style={{ fontSize: '14px', color: '#0f172a' }}>Explore by Category</b>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                  ⚡ Delivery in {eta}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '10px' }}>
                {categories.slice(0, 8).map((cat) => (
                  <Link key={cat.slug} to={`/category/${cat.slug}`} className="search-category-tile">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '6px',
                        overflow: 'hidden'
                      }}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <ShoppingBag size={18} color="#059669" />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter & Sort Toolbar */}
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
                <option value="popular">Popular</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count Summary */}
        {q.trim() && result.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              Showing <b style={{ color: '#0f172a' }}>{result.length}</b> products for{' '}
              <b style={{ color: '#059669' }}>“{q}”</b>
            </span>

            <button
              type="button"
              onClick={() => setQ('')}
              style={{ background: 'none', border: 'none', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Product Results Grid */}
        {result.length > 0 ? (
          <>
            <ProductGrid items={result} />

            {/* Related Products from same category */}
            {related && (
              <section style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '14px' }}>
                  <b style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
                    More from {related.category?.name || 'this category'}
                  </b>
                  <small style={{ fontSize: '12px', color: '#64748b' }}>
                    Customers also viewed these items
                  </small>
                </div>
                <ProductGrid items={related.items} />
              </section>
            )}
          </>
        ) : (
          /* Empty / No Matches State */
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
              margin: '20px 0'
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
              No matches found for “{q}”
            </h3>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto 20px', maxWidth: '340px', lineHeight: 1.5 }}>
              Try checking for typos or search for popular daily essentials like milk, bread, chips, or fruits.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <small style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Popular suggestions:
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {['Milk', 'Chips', 'Bread', 'Atta', 'Biscuits', 'Cold Drinks'].map((suggest) => (
                  <button
                    key={suggest}
                    type="button"
                    onClick={() => {
                      setQ(suggest);
                      handleSearchSubmit(suggest);
                    }}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      color: '#059669',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + {suggest}
                  </button>
                ))}
              </div>
            </div>

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
        )}
      </div>
    </>
  );
}
