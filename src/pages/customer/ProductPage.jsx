import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  Heart,
  ShieldCheck,
  Star,
  Truck,
  Zap,
  Sparkles,
  Clock,
  RefreshCw,
  Award,
  ChevronRight,
  Leaf,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, Button, EmptyState, ProductRail, QuantitySelector, money } from '../../components/ui';
import ProductRating from '../../components/customer/ProductRating';
import { packOptions } from '../../utils/products';

export function ProductPage() {
  const { id } = useParams();
  const {
    favorites,
    toggleFavorite,
    categories,
    products,
    deliveryConfig,
    activeDeliveryRules
  } = useApp();

  const product = products.find((item) => item.id === id || item.slug === id);
  const [image, setImage] = useState(product?.image || '');

  useEffect(() => {
    setImage(product?.image || '');
  }, [product?.id, product?.image]);

  if (!product) {
    return (
      <div className="container page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon="package"
          title="Product unavailable"
          text="This product is no longer available in our catalogue."
          action="Continue shopping"
          to="/"
        />
      </div>
    );
  }

  const gallery = product.images?.length ? product.images : [product.image];
  const rules = activeDeliveryRules || deliveryConfig;
  const eta = rules?.estimatedDelivery || '15–20 mins';
  const discountPercent = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const isFav = favorites.includes(product.id);
  const packs = packOptions(product, products);
  const categoryObj = categories.find((c) => c.slug === product.category);

  return (
    <>
      <style>{`
        .product-page-wrapper {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 14px 100px;
          box-sizing: border-box;
          width: 100%;
        }

        .product-detail-layout {
          display: grid;
          grid-template-columns: minmax(0, 480px) 1fr;
          gap: 36px;
          align-items: start;
          margin-bottom: 40px;
        }

        .product-media-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          padding: 20px;
          position: relative;
          box-sizing: border-box;
          width: 100%;
        }

        .main-image-display {
          width: 100%;
          height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border-radius: 14px;
          background: #ffffff;
          overflow: hidden;
        }

        .main-image-display img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.25s ease;
        }

        .main-image-display:hover img {
          transform: scale(1.03);
        }

        .media-discount-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          box-shadow: 0 3px 10px rgba(5, 150, 105, 0.3);
          z-index: 2;
        }

        .media-heart-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
          z-index: 2;
        }

        .media-heart-btn:hover {
          transform: scale(1.08);
          border-color: #cbd5e1;
        }

        .media-heart-btn.active {
          color: #ef4444;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .gallery-thumbs-row {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }

        .thumb-btn-v2 {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .thumb-btn-v2 img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .thumb-btn-v2.active {
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
        }

        .pack-chip-v2 {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }

        .pack-chip-v2:hover {
          border-color: #059669;
          background: #f0fdf4;
        }

        .pack-chip-v2.active {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 1px #059669;
        }

        .trust-feature-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-product-sticky-bar {
          display: none;
        }

        @media (max-width: 820px) {
          .product-page-wrapper {
            overflow-x: hidden;
            width: 100%;
          }
          .product-detail-layout {
            grid-template-columns: 100%;
            gap: 20px;
          }
          .main-image-display {
            height: 270px;
          }
          .product-media-card {
            padding: 14px;
          }
          .product-info-grid-v2 {
            grid-template-columns: 100% !important;
            gap: 16px !important;
          }
          .product-info-card-v2 {
            padding: 16px !important;
          }
          .mobile-product-sticky-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
            z-index: 95;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div className="product-page-wrapper">
        {/* Breadcrumbs Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          <Link to="/" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>
            Home
          </Link>
          <ChevronRight size={13} color="#94a3b8" />
          <Link
            to={`/category/${product.category}`}
            style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}
          >
            {categoryObj?.name || 'Category'}
          </Link>
          <ChevronRight size={13} color="#94a3b8" />
          <span style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
            {product.name}
          </span>
        </div>

        {/* Main Product Details Layout */}
        <div className="product-detail-layout">
          {/* Left Column: Media / Photo Gallery */}
          <div>
            <div className="product-media-card">
              {discountPercent > 0 && (
                <div className="media-discount-badge">
                  {discountPercent}% OFF
                </div>
              )}

              <button
                type="button"
                className={`media-heart-btn ${isFav ? 'active' : ''}`}
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
              >
                <Heart size={18} fill={isFav ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>

              <div className="main-image-display">
                <img src={image} alt={product.name} />
              </div>

              {/* Thumbnails Row (if multiple images) */}
              {gallery.length > 1 && (
                <div className="gallery-thumbs-row">
                  {gallery.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      className={`thumb-btn-v2 ${image === src ? 'active' : ''}`}
                      onClick={() => setImage(src)}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '11px',
                  color: '#64748b'
                }}
              >
                <Leaf size={14} color="#059669" />
                <span>100% Genuine & Quality Inspected</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Price, Options, Add to Cart */}
          <div>
            {/* Delivery ETA Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '11px',
                fontWeight: 800,
                marginBottom: '10px'
              }}
            >
              <Zap size={13} color="#059669" />
              <span>Instant Delivery in {eta}</span>
            </div>

            {/* Product Title */}
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#0f172a',
                margin: '0 0 6px',
                lineHeight: 1.3
              }}
            >
              {product.name}
            </h1>

            {/* Unit & Ratings Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '3px 9px',
                  borderRadius: '6px'
                }}
              >
                {product.unit}
              </span>

              <ProductRating key={product.id} product={product} />
            </div>

            {/* Pack Size Options (If multiple sizes available) */}
            {packs.length > 1 && (
              <div style={{ marginBottom: '18px' }}>
                <b style={{ fontSize: '12.5px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Select Pack Size:
                </b>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {packs.map((pack) => (
                    <Link
                      key={pack.id}
                      className={`pack-chip-v2 ${pack.id === product.id ? 'active' : ''}`}
                      to={`/product/${pack.id}`}
                    >
                      <b style={{ fontSize: '12px', color: '#0f172a' }}>{pack.unit}</b>
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                        {money(pack.price)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Price Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '18px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                  {money(product.price)}
                </strong>

                {product.mrp > product.price && (
                  <>
                    <del style={{ fontSize: '14px', color: '#94a3b8' }}>
                      MRP {money(product.mrp)}
                    </del>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}
                    >
                      Save {money(product.mrp - product.price)}
                    </span>
                  </>
                )}
              </div>

              <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                (Inclusive of all taxes)
              </small>

              {/* Stock Status */}
              <div style={{ marginTop: '10px' }}>
                {product.stock > 0 ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: product.stock <= (product.lowStockThreshold || 5) ? '#b45309' : '#047857',
                      background: product.stock <= (product.lowStockThreshold || 5) ? '#fef3c7' : '#ecfdf5',
                      padding: '3px 9px',
                      borderRadius: '6px'
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                    {product.stock <= (product.lowStockThreshold || 5)
                      ? `Hurry, only ${product.stock} left in stock!`
                      : `In Stock · ${product.stock} units available`}
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#b91c1c',
                      background: '#fee2e2',
                      padding: '3px 9px',
                      borderRadius: '6px'
                    }}
                  >
                    Currently Out of Stock
                  </span>
                )}
              </div>

              {/* Desktop Add to Cart Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ minWidth: '130px' }}>
                  <QuantitySelector id={product.id} />
                </div>

                <Button
                  variant="ghost"
                  onClick={() => toggleFavorite(product.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '8px 14px'
                  }}
                >
                  <Heart size={16} fill={isFav ? 'currentColor' : 'none'} color={isFav ? '#ef4444' : '#475569'} />
                  <span>{isFav ? 'Saved' : 'Save'}</span>
                </Button>
              </div>
            </div>

            {/* Trust Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="trust-feature-card">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Truck size={17} />
                </div>
                <div>
                  <b style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>
                    Superfast {eta} Delivery
                  </b>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    Direct from nearest R2Cart dark store to your doorstep
                  </small>
                </div>
              </div>

              <div className="trust-feature-card">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <b style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>
                    100% Quality Assurance
                  </b>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    Hygiene checked & sealed before dispatch
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Details Section */}
        <div
          className="product-info-card-v2"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '22px',
            marginBottom: '36px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            Product Information
          </h2>

          <div
            className="product-info-grid-v2"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
                Description
              </h3>
              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
                {product.description || 'Fresh and authentic quality product sourced for everyday culinary essentials.'}
              </p>
            </div>

            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
                Product Details
              </h3>
              <dl style={{ margin: 0, fontSize: '12px', display: 'grid', gridTemplateColumns: '100px minmax(0, 1fr)', gap: '8px', width: '100%' }}>
                <dt style={{ color: '#64748b', fontWeight: 600 }}>Unit / Net Qty</dt>
                <dd style={{ margin: 0, color: '#0f172a', fontWeight: 700, minWidth: 0, wordBreak: 'break-word' }}>{product.unit}</dd>

                <dt style={{ color: '#64748b', fontWeight: 600 }}>SKU Code</dt>
                <dd style={{ margin: 0, color: '#0f172a', fontWeight: 600, minWidth: 0, wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                  {product.sku || 'N/A'}
                </dd>

                <dt style={{ color: '#64748b', fontWeight: 600 }}>Storage Info</dt>
                <dd style={{ margin: 0, color: '#0f172a', minWidth: 0, wordBreak: 'break-word' }}>Store in a cool, dry and hygienic environment.</dd>
              </dl>
            </div>

            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
                Disclaimer
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>
                Actual product packaging and materials may contain more or different information. Product images are for representation purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Product Recommendations Rails */}
        <ProductRail
          title="Similar Products"
          items={products.filter((item) => item.category === product.category && item.id !== product.id)}
        />
        <ProductRail
          title="You May Also Like"
          items={products.filter((item) => item.id !== product.id).slice(4, 12)}
        />

        {/* Mobile Sticky Add to Cart Bottom Bar */}
        <div className="mobile-product-sticky-bar">
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <b style={{ fontSize: '16px', color: '#0f172a' }}>{money(product.price)}</b>
              {product.mrp > product.price && (
                <del style={{ fontSize: '11.5px', color: '#94a3b8' }}>{money(product.mrp)}</del>
              )}
            </div>
            <small style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
              {product.unit} {discountPercent > 0 && <span style={{ color: '#059669', fontWeight: 800 }}>({discountPercent}% OFF)</span>}
            </small>
          </div>

          <div style={{ minWidth: '120px' }}>
            <QuantitySelector id={product.id} />
          </div>
        </div>
      </div>
    </>
  );
}
