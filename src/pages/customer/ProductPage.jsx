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
  ChevronLeft,
  ChevronRight,
  Leaf,
  ShoppingBag,
  Layers,
  FileText,
  AlertTriangle,
  PhoneCall
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Badge, Button, EmptyState, ProductRail, QuantitySelector, money } from '../../components/ui';
import ProductRating from '../../components/customer/ProductRating';
import ProductEnquiryModal from '../../components/customer/ProductEnquiryModal';
import { isProductComingSoon } from '../../config/homeLayout';
import { packOptions } from '../../utils/products';
import { parseProductDetails } from '../../utils/productDetails';

export function ProductPage() {
  const { id } = useParams();
  const {
    favorites,
    toggleFavorite,
    categories,
    products,
    deliveryConfig,
    activeDeliveryRules,
    storeSettings
  } = useApp();
  const { t, tCat, tProd, tEta } = useLanguage();

  const product = products.find((item) => item.id === id || item.slug === id);

  const gallery = (product?.images && product.images.length > 0)
    ? product.images
    : (product?.image ? [product.image] : []);

  const [imgIdx, setImgIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  useEffect(() => {
    setImgIdx(0);
  }, [product?.id]);

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

  const prevImg = () => {
    setImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const nextImg = () => {
    setImgIdx((prev) => (prev + 1) % gallery.length);
  };

  const onTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    if (deltaX > 40) nextImg();
    else if (deltaX < -40) prevImg();
    setTouchStartX(null);
  };

  const currentImage = gallery[imgIdx] || product.image || '';
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
  const discountPercent = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const isFav = favorites.includes(product.id);
  const packs = packOptions(product, products);
  const categoryObj = categories.find((c) => c.slug === product.category);
  const isProductSoon = isProductComingSoon(product, storeSettings);

  // Parse rich structured details (or fallback to plain description with auto-inference)
  const details = parseProductDetails(product.description, product);
  const dietaryPref = details.dietaryPreference || '';
  const isVeg = dietaryPref.toLowerCase().includes('veg') && !dietaryPref.toLowerCase().includes('non');
  const isNonVeg = dietaryPref.toLowerCase().includes('non-veg');
  const hasNutrition = details.nutrition && Object.entries(details.nutrition).some(([k, v]) => k !== 'serving' && Boolean(v));

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
          margin-bottom: 36px;
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
          user-select: none;
        }

        .main-image-display {
          width: 100%;
          height: 350px;
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

        .gallery-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          padding: 0;
          transition: all 0.2s ease;
          color: #0f172a;
        }

        .gallery-nav-btn:hover {
          background: #ffffff;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          transform: translateY(-50%) scale(1.06);
        }

        .gallery-nav-btn.prev {
          left: 10px;
        }

        .gallery-nav-btn.next {
          right: 10px;
        }

        .gallery-counter-pill {
          position: absolute;
          bottom: 12px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          backdrop-filter: blur(4px);
          z-index: 4;
        }

        .gallery-dots-bar {
          display: flex;
          justify-content: center;
          gap: 5px;
          margin-top: 10px;
        }

        .gallery-dot {
          width: 6px;
          height: 6px;
          border-radius: 6px;
          background: #cbd5e1;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .gallery-dot.active {
          width: 18px;
          background: #059669;
        }

        .media-discount-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25);
          z-index: 4;
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          z-index: 4;
          transition: all 0.2s ease;
        }

        .media-heart-btn.active {
          color: #ef4444;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .gallery-thumbs-row {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }

        .thumb-btn-v2 {
          width: 58px;
          height: 58px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          padding: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .thumb-btn-v2.active {
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
        }

        .thumb-btn-v2 img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .pack-chip-v2 {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-decoration: none;
          background: #ffffff;
          transition: all 0.2s ease;
          min-width: 80px;
        }

        .pack-chip-v2.active {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.12);
        }

        .trust-feature-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
        }

        /* FSSAI Official Symbol */
        .fssai-indicator {
          width: 17px;
          height: 17px;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #ffffff;
        }

        .fssai-indicator.veg {
          border: 2px solid #16a34a;
        }

        .fssai-indicator.veg .fssai-circle {
          width: 7.5px;
          height: 7.5px;
          border-radius: 50%;
          background: #16a34a;
        }

        .fssai-indicator.non-veg {
          border: 2px solid #dc2626;
        }

        .fssai-indicator.non-veg .fssai-triangle {
          width: 0;
          height: 0;
          border-left: 4.5px solid transparent;
          border-right: 4.5px solid transparent;
          border-bottom: 7.5px solid #dc2626;
        }

        .dietary-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          font-size: 12px;
          font-weight: 700;
          color: #15803d;
        }

        .dietary-badge-pill.non-veg {
          background: #fef2f2;
          border-color: #fecaca;
          color: #b91c1c;
        }

        /* Specifications section */
        .specs-section-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .spec-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          width: 100%;
        }

        .spec-card-title {
          font-size: 15px;
          fontWeight: 800;
          color: #0f172a;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f1f5f9;
        }

        .specs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .spec-item {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .spec-item .label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }

        .spec-item .val {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          word-break: break-word;
        }

        .spec-item .val.brand-name {
          color: #059669;
          font-size: 14.5px;
        }

        /* Feature checklist */
        .features-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.5;
          color: #334155;
        }

        .feature-check-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #059669;
          font-weight: 900;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Nutrition grid */
        .nutrition-grid-table {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 10px;
        }

        .nutrition-tile {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nutri-val {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
        }

        .nutri-name {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        .allergen-warning-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 12px;
        }

        .mobile-product-sticky-bar {
          display: none;
        }

        @media (max-width: 860px) {
          .gallery-nav-btn {
            display: none !important;
          }
          .product-detail-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .main-image-display {
            height: 280px;
          }
          .specs-grid {
            grid-template-columns: 1fr 1fr;
          }
          .nutrition-grid-table {
            grid-template-columns: repeat(3, 1fr);
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
            {tCat(categoryObj?.name) || 'Category'}
          </Link>
          <ChevronRight size={13} color="#94a3b8" />
          <span style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
            {tProd(product.name)}
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

              <div
                className="main-image-display"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <img src={currentImage} alt={tProd(product.name)} />

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="gallery-nav-btn prev"
                      onClick={prevImg}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="gallery-nav-btn next"
                      onClick={nextImg}
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="gallery-counter-pill">
                      {imgIdx + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {/* Dots on mobile / thumbnails on desktop */}
              {gallery.length > 1 && (
                <>
                  <div className="gallery-dots-bar">
                    {gallery.map((_, dotI) => (
                      <span
                        key={dotI}
                        className={`gallery-dot ${dotI === imgIdx ? 'active' : ''}`}
                        onClick={() => setImgIdx(dotI)}
                      />
                    ))}
                  </div>

                  <div className="gallery-thumbs-row">
                    {gallery.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        className={`thumb-btn-v2 ${imgIdx === idx ? 'active' : ''}`}
                        onClick={() => setImgIdx(idx)}
                      >
                        <img src={src} alt={`${tProd(product.name) || product.name || 'Product'} thumbnail ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                </>
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
            {/* Top Row: Delivery ETA Pill & Dietary Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
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
                  fontWeight: 800
                }}
              >
                <Zap size={13} color={isClosed || isPaused ? "#d97706" : "#059669"} />
                <span>{isClosed || isPaused ? (isStoreFullyClosed || isPaused ? 'Delivery Unavailable' : 'Scheduled Delivery Available') : `Instant Delivery in ${tEta(eta)}`}</span>
              </div>

              {dietaryPref && (
                <div className={`dietary-badge-pill ${isNonVeg ? 'non-veg' : ''}`}>
                  {isVeg ? (
                    <span className="fssai-indicator veg" title="Vegetarian">
                      <span className="fssai-circle" />
                    </span>
                  ) : isNonVeg ? (
                    <span className="fssai-indicator non-veg" title="Non-Vegetarian">
                      <span className="fssai-triangle" />
                    </span>
                  ) : (
                    <Leaf size={13} color="#059669" />
                  )}
                  <span>{dietaryPref}</span>
                </div>
              )}
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
              {tProd(product.name)}
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
                  <del style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 600 }}>
                    {money(product.mrp)}
                  </del>
                )}
                {discountPercent > 0 && (
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <small style={{ color: '#64748b', fontSize: '11.5px', display: 'block', marginTop: '2px' }}>
                Inclusive of all taxes
              </small>

              {/* Stock Indicator */}
              <div style={{ marginTop: '10px' }}>
                {product.stock > 0 ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: product.stock <= (product.lowStockThreshold || 5) ? '#d97706' : '#059669',
                      background: product.stock <= (product.lowStockThreshold || 5) ? '#fef3c7' : '#ecfdf5',
                      padding: '3px 9px',
                      borderRadius: '6px'
                    }}
                  >
                    <Check size={13} />
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

              {isProductSoon && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', marginTop: '14px', color: '#92400e' }}>
                  <Clock size={18} color="#d97706" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                    <b style={{ color: '#78350f', display: 'block' }}>Coming Soon</b>
                    <span>This product belongs to <b>{categoryObj?.name || 'this category'}</b> which is coming soon and cannot be ordered yet.</span>
                  </div>
                </div>
              )}

              {/* Desktop Add to Cart Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                {product.orderMode === 'CONTACT_REQUEST' ? (
                  <Button
                    onClick={() => setEnquiryModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ea580c',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '13.5px'
                    }}
                  >
                    <PhoneCall size={16} /> Request Custom Quote / Enquire
                  </Button>
                ) : (
                  <>
                    <div style={{ minWidth: '130px' }}>
                      <QuantitySelector id={product.id} />
                    </div>
                    {product.orderMode === 'BOTH' && (
                      <Button
                        variant="secondary"
                        onClick={() => setEnquiryModalOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#fff7ed',
                          color: '#c2410c',
                          border: '1px solid #fed7aa',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '12.5px'
                        }}
                      >
                        <PhoneCall size={14} /> Custom Inquiry
                      </Button>
                    )}
                  </>
                )}

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
                    {isClosed || isPaused ? 'Scheduled Grocery Delivery' : `Superfast ${eta} Delivery`}
                  </b>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    Direct from nearest dark store to your doorstep
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

        {/* Production-Grade Product Specifications & Highlights */}
        <div className="specs-section-container">
          {/* 1. Key Features / Highlights Checklist */}
          {details.keyFeatures && details.keyFeatures.length > 0 && (
            <div className="spec-card">
              <h2 className="spec-card-title">
                <Sparkles size={16} color="#059669" />
                <span>Key Features & Highlights</span>
              </h2>
              <ul className="features-checklist">
                {details.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="feature-item">
                    <span className="feature-check-icon">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Structured Specifications Grid */}
          <div className="spec-card">
            <h2 className="spec-card-title">
              <Layers size={16} color="#059669" />
              <span>Product Specifications & Details</span>
            </h2>
            <div className="specs-grid">
              {details.brand && (
                <div className="spec-item">
                  <span className="label">Brand</span>
                  <span className="val brand-name">{details.brand}</span>
                </div>
              )}
              {details.productType && (
                <div className="spec-item">
                  <span className="label">Product Type</span>
                  <span className="val">{details.productType}</span>
                </div>
              )}
              {dietaryPref && (
                <div className="spec-item">
                  <span className="label">Dietary Preference</span>
                  <span className="val">{dietaryPref}</span>
                </div>
              )}
              {details.flavour && (
                <div className="spec-item">
                  <span className="label">Flavour</span>
                  <span className="val">{details.flavour}</span>
                </div>
              )}
              {details.itemForm && (
                <div className="spec-item">
                  <span className="label">Item Form</span>
                  <span className="val">{details.itemForm}</span>
                </div>
              )}
              <div className="spec-item">
                <span className="label">Unit / Net Weight</span>
                <span className="val">{details.weight || product.unit}</span>
              </div>
              {details.itemIncluded && (
                <div className="spec-item">
                  <span className="label">Items Included</span>
                  <span className="val">{details.itemIncluded}</span>
                </div>
              )}
              {details.packagingType && (
                <div className="spec-item">
                  <span className="label">Packaging Type</span>
                  <span className="val">{details.packagingType}</span>
                </div>
              )}
              {details.shelfLife && (
                <div className="spec-item">
                  <span className="label">Shelf Life</span>
                  <span className="val">{details.shelfLife}</span>
                </div>
              )}
              <div className="spec-item">
                <span className="label">Country of Origin</span>
                <span className="val">{details.countryOfOrigin || 'India'}</span>
              </div>
              {product.sku && (
                <div className="spec-item">
                  <span className="label">SKU Code</span>
                  <span className="val" style={{ fontFamily: 'monospace' }}>{product.sku}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Nutrition Information Table */}
          {hasNutrition && (
            <div className="spec-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 className="spec-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                  <Award size={16} color="#059669" />
                  <span>Nutritional Information</span>
                </h2>
                <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
                  {details.nutrition.serving || 'Per 100g'}
                </span>
              </div>

              <div className="nutrition-grid-table">
                {details.nutrition.energy && (
                  <div className="nutrition-tile">
                    <span className="nutri-val">{details.nutrition.energy}</span>
                    <span className="nutri-name">Energy (kcal)</span>
                  </div>
                )}
                {details.nutrition.protein && (
                  <div className="nutrition-tile">
                    <span className="nutri-val">{details.nutrition.protein}</span>
                    <span className="nutri-name">Protein</span>
                  </div>
                )}
                {details.nutrition.carbs && (
                  <div className="nutrition-tile">
                    <span className="nutri-val">{details.nutrition.carbs}</span>
                    <span className="nutri-name">Carbohydrates</span>
                  </div>
                )}
                {details.nutrition.sugars && (
                  <div className="nutrition-tile">
                    <span className="nutri-val">{details.nutrition.sugars}</span>
                    <span className="nutri-name">Total Sugars</span>
                  </div>
                )}
                {details.nutrition.addedSugars && (
                  <div className="nutrition-tile">
                    <span className="nutri-val">{details.nutrition.addedSugars}</span>
                    <span className="nutri-name">Added Sugars</span>
                  </div>
                )}
                {details.nutrition.fat && (
                  <div className="nutrition-tile">
                    <span className="nutri-val">{details.nutrition.fat}</span>
                    <span className="nutri-name">Total Fat</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Ingredients & Allergen Alert */}
          {(details.ingredients || details.allergens) && (
            <div className="spec-card">
              {details.ingredients && (
                <div style={{ marginBottom: details.allergens ? '14px' : 0 }}>
                  <h2 className="spec-card-title">
                    <FileText size={16} color="#059669" />
                    <span>Ingredients</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {details.ingredients}
                  </p>
                </div>
              )}

              {details.allergens && (
                <div className="allergen-warning-box">
                  <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <b style={{ fontSize: '12px', color: '#92400e', display: 'block' }}>Allergen Warning:</b>
                    <span style={{ fontSize: '12.5px', color: '#78350f' }}>{details.allergens}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Storage Instructions & Summary */}
          <div className="spec-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '20px' }}>❄️</div>
              <div>
                <b style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                  Storage Instructions
                </b>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                  {details.storage || 'Store in a cool, dry and hygienic place and avoid direct sunlight.'}
                </p>
              </div>
            </div>

            {details.summary && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
                  About this item
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
                  {details.summary}
                </p>
              </div>
            )}

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <small style={{ color: '#94a3b8', fontSize: '11px', display: 'block', lineHeight: 1.5 }}>
                Disclaimer: Every effort is made to maintain accuracy of all information. However, actual product packaging and materials may contain more and/or different information. It is recommended not to solely rely on the information presented.
              </small>
            </div>
          </div>
        </div>

        {/* Product Recommendations Rails */}
        <div style={{ marginTop: '36px' }}>
          <ProductRail
            title="Similar Products"
            items={products.filter((item) => item.category === product.category && item.id !== product.id)}
          />
          <ProductRail
            title="You May Also Like"
            items={products.filter((item) => item.id !== product.id).slice(4, 12)}
          />
        </div>

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
            {product.orderMode === 'CONTACT_REQUEST' ? (
              <Button
                onClick={() => setEnquiryModalOpen(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#ea580c',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 700
                }}
              >
                📞 Enquire Quote
              </Button>
            ) : (
              <QuantitySelector id={product.id} />
            )}
          </div>
        </div>
      </div>

      <ProductEnquiryModal
        product={product}
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </>
  );
}
