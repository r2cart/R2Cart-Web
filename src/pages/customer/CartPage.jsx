import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock3,
  Trash2,
  MapPin,
  Tag,
  Check,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Plus,
  Minus,
  ShoppingBag,
  AlertCircle,
  ArrowRight,
  Zap,
  Leaf
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, EmptyState, money } from '../../components/ui';
import { customerService } from '../../services/customer.service';

const PRESET_INSTRUCTIONS = [
  { id: 'no-bell', label: "Don't ring bell", icon: '🔕' },
  { id: 'at-door', label: 'Leave at door', icon: '🚪' },
  { id: 'call-first', label: 'Call before delivery', icon: '📞' },
  { id: 'with-guard', label: 'Leave with guard', icon: '🛡️' }
];

export function CartPage() {
  const {
    cartItems,
    qty,
    add,
    subtotal,
    mrpTotal,
    notify,
    user,
    activeDeliveryRules,
    deliveryConfig,
    openAuthModal,
    activeAddress,
    location,
    setLocationOpen,
    categories,
    products,
    storeSettings
  } = useApp();

  const nav = useNavigate();
  const rules = activeDeliveryRules || deliveryConfig;

  // Coupon state
  const [coupon, setCoupon] = useState(() => sessionStorage.getItem('r2cart-coupon') || '');
  const [applied, setApplied] = useState(() => {
    const code = sessionStorage.getItem('r2cart-coupon');
    const discount = Number(sessionStorage.getItem('r2cart-coupon-discount') || 0);
    return code ? { code, discount } : null;
  });
  const [applying, setApplying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Delivery instructions state
  const [selectedInstructions, setSelectedInstructions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('r2cart-delivery-instruction-presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customNote, setCustomNote] = useState(() => sessionStorage.getItem('r2cart-custom-note') || '');
  const [showNoteInput, setShowNoteInput] = useState(() => Boolean(sessionStorage.getItem('r2cart-custom-note')));

  const [hasModalOpen, setHasModalOpen] = useState(false);

  // Hide sticky checkout bar when any modal/backdrop is active
  useEffect(() => {
    const checkModal = () => {
      const hasBackdrop = Boolean(document.querySelector('.modal-backdrop'));
      const hasDialog = Boolean(document.querySelector('dialog[open]'));
      const bodyLocked = document.body.style.overflow === 'hidden' || document.body.classList.contains('modal-open');
      setHasModalOpen(hasBackdrop || hasDialog || bodyLocked);
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, []);

  // Load available coupons if logged in
  useEffect(() => {
    let mounted = true;
    if (user) {
      customerService.coupons()
        .then((res) => {
          if (!mounted) return;
          const list = Array.isArray(res) ? res : res?.data || [];
          setAvailableCoupons(list.slice(0, 3));
        })
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [user]);

  // Sync instruction changes to session
  useEffect(() => {
    sessionStorage.setItem('r2cart-delivery-instruction-presets', JSON.stringify(selectedInstructions));
    sessionStorage.setItem('r2cart-custom-note', customNote);
    const combined = [...selectedInstructions, customNote].filter(Boolean).join('. ');
    sessionStorage.setItem('r2cart-delivery-instruction', combined || 'Call before delivery');
  }, [selectedInstructions, customNote]);

  const toggleInstruction = (label) => {
    setSelectedInstructions((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  // Calculations
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const freeThreshold = Number(rules?.freeDeliveryThreshold || 0);
  const deliveryFee = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : Number(rules?.deliveryFee || 0);
  const couponDiscount = applied?.discount || 0;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const minimumRemaining = Math.max(0, Number(rules?.minimumOrder || 0) - subtotal);
  const productSavings = Math.max(0, Number(mrpTotal || 0) - Number(subtotal || 0));
  const totalSavings = productSavings + couponDiscount;
  const diffForFree = freeThreshold > 0 && subtotal < freeThreshold ? freeThreshold - subtotal : 0;
  const freePercent = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100;

  // Coupon handling
  const apply = async (codeToApply) => {
    const code = (codeToApply || coupon).trim().toUpperCase();
    if (!user) return notify('Please sign in to apply a coupon', 'error');
    if (!code) return notify('Enter a coupon code', 'error');

    setApplying(true);
    try {
      const result = await customerService.validateCoupon(code);
      const value = { code: result.code, discount: Number(result.discount) };
      setApplied(value);
      setCoupon(result.code);
      sessionStorage.setItem('r2cart-coupon', result.code);
      sessionStorage.setItem('r2cart-coupon-discount', String(result.discount));
      notify(`Coupon applied! You save ${money(result.discount)}`);
    } catch (error) {
      setApplied(null);
      sessionStorage.removeItem('r2cart-coupon');
      sessionStorage.removeItem('r2cart-coupon-discount');
      notify(error.message || 'Invalid or expired coupon', 'error');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCoupon('');
    sessionStorage.removeItem('r2cart-coupon');
    sessionStorage.removeItem('r2cart-coupon-discount');
    notify('Coupon removed');
  };

  const handleProceed = () => {
    if (minimumRemaining > 0) {
      return notify(`Add ${money(minimumRemaining)} more to reach minimum order of ${money(rules.minimumOrder)}`, 'error');
    }
    const comingSoonCats = storeSettings?.policies?.homeLayout?.comingSoonCategories || [];
    const comingSoonItem = cartItems.find((p) => {
      const slug = p.categorySlug || p.category?.slug || p.category;
      return slug && comingSoonCats.includes(slug);
    });
    if (comingSoonItem) {
      return notify(`"${comingSoonItem.name}" belongs to a Coming Soon category and cannot be ordered. Please remove it from your basket to proceed.`, 'error');
    }
    const outOfStockItem = cartItems.find((p) => p.stock < p.qty);
    if (outOfStockItem) {
      return notify(
        outOfStockItem.stock <= 0
          ? `${outOfStockItem.name} is out of stock`
          : `Only ${outOfStockItem.stock} left for ${outOfStockItem.name}`,
        'error'
      );
    }
    if (!user && !localStorage.getItem('r2cart-access-token')) {
      sessionStorage.setItem('r2cart-auth-redirect', '/checkout');
      openAuthModal('order');
      return;
    }
    nav('/checkout');
  };

  // Scroll smoothly to bill details
  const scrollToBill = () => {
    const el = document.getElementById('cart-bill-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Empty cart view
  if (!cartItems.length) {
    const popularCategories = (categories && categories.length > 0 ? categories : [
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
      { name: 'Dairy & Bread', slug: 'dairy-bread' },
      { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal' },
      { name: 'Snacks & Drinks', slug: 'snacks-drinks' }
    ]).slice(0, 6);

    const popularProducts = (products && products.length > 0 ? products : []).filter((p) => p.stock > 0).slice(0, 4);

    return (
      <div className="container" style={{ padding: '0 0 30px', boxSizing: 'border-box' }}>
        <div className="checkout-empty-wrapper">
          <div className="checkout-empty-card">
          <style>{`
          @keyframes floatBag {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-6px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes ringGlow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35); }
            70% { box-shadow: 0 0 0 14px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .empty-bag-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            position: relative;
            animation: floatBag 4s ease-in-out infinite, ringGlow 2.5s infinite;
          }
          .empty-bag-circle::after {
            content: '';
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 2px dashed rgba(16, 185, 129, 0.4);
          }
          .empty-cart-cta-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: #ffffff !important;
            font-size: 14.5px;
            font-weight: 800;
            padding: 13px 28px;
            border-radius: 14px;
            text-decoration: none;
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.28);
            transition: all 0.2s ease;
          }
          .empty-cart-cta-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(5, 150, 105, 0.36);
          }
          .empty-cat-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            text-decoration: none;
            color: #1e293b;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }
          .empty-cat-card:hover {
            border-color: #a7f3d0;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(5, 150, 105, 0.08);
          }
          .empty-prod-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          @media (max-width: 480px) {
            .empty-prod-grid {
              grid-template-columns: 1fr;
            }
          }
          .empty-prod-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            box-sizing: border-box;
            transition: all 0.15s ease;
          }
          .empty-prod-card:hover {
            border-color: #a7f3d0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          }
        `}</style>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="empty-bag-circle">
            <ShoppingBag size={40} strokeWidth={2.2} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}
          >
            <Zap size={13} color="#059669" />
            <span>Delivery in {rules?.estimatedDelivery || '15–20 mins'}</span>
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 8px',
              letterSpacing: '-0.4px'
            }}
          >
            Your basket is empty
          </h1>

          <p
            style={{
              fontSize: '13.5px',
              color: '#64748b',
              margin: '0 auto 20px',
              maxWidth: '360px',
              lineHeight: 1.5
            }}
          >
            Fresh fruits, farm vegetables, dairy, snacks, and daily essentials are just a tap away.
          </p>

          <Link to="/" className="empty-cart-cta-btn">
            <span>Explore Groceries</span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Popular Categories Grid */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <b style={{ fontSize: '14.5px', color: '#0f172a', display: 'block' }}>
                Explore Categories
              </b>
              <small style={{ fontSize: '11.5px', color: '#64748b' }}>
                Quick access to daily essentials
              </small>
            </div>
            <Link to="/" style={{ fontSize: '12px', color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '10px'
            }}
          >
            {popularCategories.map((cat) => (
              <Link key={cat.slug} to={`/category/${cat.slug}`} className="empty-cat-card">
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingBag size={20} color="#059669" />
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11.5px',
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

        {/* Popular Essentials Shelf with 1-Tap ADD */}
        {popularProducts.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <b style={{ fontSize: '14.5px', color: '#0f172a', display: 'block' }}>
                  Popular Essentials
                </b>
                <small style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Frequently added by customers
                </small>
              </div>
            </div>

            <div className="empty-prod-grid">
              {popularProducts.map((p) => (
                <div key={p.id} className="empty-prod-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc', flexShrink: 0 }}
                      loading="lazy"
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: '12.5px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </b>
                      <small style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                        {p.unit || 'Pack'}
                      </small>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <b style={{ fontSize: '13px', color: '#0f172a' }}>{money(p.price)}</b>
                        {p.mrp > p.price && (
                          <del style={{ fontSize: '10.5px', color: '#94a3b8' }}>{money(p.mrp)}</del>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof add === 'function') add(p.id, 1);
                      else if (typeof qty === 'function') qty(p.id, 1);
                      if (notify) notify(`Added ${p.name} to basket!`);
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #059669',
                      color: '#059669',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#059669';
                    }}
                  >
                    + ADD
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Assurance Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '14px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Zap size={18} color="#059669" />
            <b style={{ fontSize: '11.5px', color: '#0f172a' }}>15–20 Mins</b>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Lightning Fast</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
            <Leaf size={18} color="#059669" />
            <b style={{ fontSize: '11.5px', color: '#0f172a' }}>100% Fresh</b>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Quality Checked</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={18} color="#059669" />
            <b style={{ fontSize: '11.5px', color: '#0f172a' }}>Safe Delivery</b>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Hygienic Packing</span>
          </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  const deliveryAddressLabel = activeAddress
    ? `${activeAddress.type || 'Home'} · ${activeAddress.area || activeAddress.city || 'Hathua'}`
    : location !== 'Select delivery address'
    ? location
    : 'Select delivery address';

  return (
    <>
      <style>{`
        .cart-page-wrapper {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 12px 120px;
        }
        .cart-grid-container {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        .cart-card-v2 {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          padding: 16px;
          margin-bottom: 16px;
          transition: box-shadow 0.2s ease;
        }
        .cart-item-row-v2 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .cart-item-row-v2:last-child {
          border-bottom: none;
          padding-bottom: 4px;
        }
        .cart-item-thumb-v2 {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          object-fit: cover;
          flex-shrink: 0;
        }
        .cart-stepper-v2 {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #059669;
          border-radius: 10px;
          color: #ffffff;
          height: 32px;
          padding: 2px 4px;
          gap: 3px;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .cart-stepper-btn {
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          border-radius: 6px;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }
        .cart-stepper-btn svg {
          display: block;
          margin: 0;
          flex-shrink: 0;
        }
        .cart-stepper-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .cart-stepper-val {
          font-size: 13.5px;
          font-weight: 800;
          min-width: 20px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          text-align: center;
          padding: 0 2px;
          color: #ffffff;
          user-select: none;
        }
        .cart-pref-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          transition: all 0.15s ease;
        }
        .cart-pref-chip.active {
          background: #ecfdf5;
          border-color: #10b981;
          color: #065f46;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15);
        }
        .mobile-sticky-checkout-bar {
          display: none;
        }
        @media (max-width: 820px) {
          .cart-page-wrapper {
            padding: 10px 10px 110px;
          }
          .cart-grid-container {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .mobile-sticky-checkout-bar {
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
          }
          body.modal-open .mobile-sticky-checkout-bar,
          body:has(.modal-backdrop) .mobile-sticky-checkout-bar {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        }
      `}</style>

      <div className="cart-page-wrapper">
        {/* Top Header Row: Delivery ETA & Destination Pill */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            padding: '12px 16px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              <Clock3 size={18} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)'
                  }}
                />
                <b style={{ fontSize: '13.5px', color: '#0f172a' }}>
                  Delivery in {rules?.estimatedDelivery || '10-15 mins'}
                </b>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '300px'
                }}
              >
                Ship to: <span style={{ fontWeight: 600, color: '#334155' }}>{deliveryAddressLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#059669',
              border: '1px solid #bbf7d0',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <MapPin size={13} /> Change
          </button>
        </div>

        {/* Free Delivery Meter / Savings Ribbon */}
        {freeThreshold > 0 && (
          <div
            style={{
              background: subtotal >= freeThreshold ? '#ecfdf5' : '#f0f9ff',
              border: subtotal >= freeThreshold ? '1px solid #a7f3d0' : '1px solid #bae6fd',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: subtotal >= freeThreshold ? '#065f46' : '#0369a1' }}>
                {subtotal >= freeThreshold ? (
                  <>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Free Delivery Unlocked! 🎉</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} color="#0284c7" />
                    <span>Add {money(diffForFree)} more for FREE Delivery</span>
                  </>
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: subtotal >= freeThreshold ? '#059669' : '#0284c7' }}>
                {freePercent}%
              </span>
            </div>

            {/* Progress track */}
            <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${freePercent}%`,
                  height: '100%',
                  background: subtotal >= freeThreshold ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #0284c7)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Total Savings Ribbon if MRP is higher than offer price */}
        {totalSavings > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
              border: '1px solid #fef08a',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#854d0e',
              fontSize: '12.5px',
              fontWeight: 700
            }}
          >
            <Sparkles size={16} color="#ca8a04" />
            <span>Hurray! You are saving {money(totalSavings)} on this order</span>
          </div>
        )}

        {/* Main 2-Column Responsive Grid */}
        <div className="cart-grid-container">
          {/* Left Column: Items List & Instructions */}
          <section>
            {/* Cart Items Card */}
            <div className="cart-card-v2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Cart Items ({itemCount})
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  {cartItems.length} {cartItems.length === 1 ? 'product' : 'products'}
                </span>
              </div>

              <div>
                {cartItems.map((product) => {
                  const itemDiscount = product.mrp > product.price
                    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                    : 0;

                  return (
                    <div className="cart-item-row-v2" key={product.id}>
                      {/* Product Image */}
                      <Link to={`/product/${product.id}`} style={{ position: 'relative', display: 'block', flexShrink: 0 }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="cart-item-thumb-v2"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2222%22%3E🛒%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {itemDiscount > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-4px',
                              left: '-4px',
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            {itemDiscount}% OFF
                          </span>
                        )}
                      </Link>

                      {/* Product Copy & Pricing */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          to={`/product/${product.id}`}
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#1e293b',
                            textDecoration: 'none',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.35
                          }}
                        >
                          {product.name}
                        </Link>

                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                          {product.unit || 'Standard Pack'}
                        </div>

                        {/* Stock Warnings */}
                        {product.stock <= 0 ? (
                          <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <AlertCircle size={12} /> Out of stock! Please remove
                          </span>
                        ) : product.stock < product.qty ? (
                          <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <AlertCircle size={12} /> Only {product.stock} left in stock
                          </span>
                        ) : null}

                        {Boolean((product.categorySlug || product.category?.slug || product.category) && (storeSettings?.policies?.homeLayout?.comingSoonCategories || []).includes(product.categorySlug || product.category?.slug || product.category)) && (
                          <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: '5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                            <Clock3 size={12} /> Coming Soon · Remove to checkout
                          </span>
                        )}

                        {/* Pricing */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a' }}>
                            {money(product.price * product.qty)}
                          </span>
                          {product.mrp > product.price && (
                            <del style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                              {money(product.mrp * product.qty)}
                            </del>
                          )}
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            ({money(product.price)} each)
                          </span>
                        </div>
                      </div>

                      {/* Stepper (+ / -) */}
                      <div className="cart-stepper-v2">
                        <button
                          type="button"
                          className="cart-stepper-btn"
                          onClick={() => {
                            qty(product.id, product.qty - 1);
                            if (product.qty - 1 <= 0) notify(`${product.name} removed`);
                          }}
                          aria-label={`Decrease ${product.name}`}
                        >
                          {product.qty === 1 ? <Trash2 size={13} color="#ffffff" /> : <Minus size={13} strokeWidth={2.5} />}
                        </button>

                        <span className="cart-stepper-val">{product.qty}</span>

                        <button
                          type="button"
                          className="cart-stepper-btn"
                          onClick={() => qty(product.id, product.qty + 1)}
                          aria-label={`Increase ${product.name}`}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add more items link */}
              <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Want to add fresh fruits or daily dairy?</span>
                <Link
                  to="/"
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#059669',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  + Add more items
                </Link>
              </div>
            </div>

            {/* Delivery Instructions (Zepto / Blinkit Quick Chips) */}
            <div className="cart-card-v2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Delivery Preferences
                </h4>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Optional</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {PRESET_INSTRUCTIONS.map((pref) => {
                  const isActive = selectedInstructions.includes(pref.label);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      className={`cart-pref-chip ${isActive ? 'active' : ''}`}
                      onClick={() => toggleInstruction(pref.label)}
                    >
                      <span>{pref.icon}</span>
                      <span>{pref.label}</span>
                      {isActive && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              {!showNoteInput ? (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#059669',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  + Add custom instructions for delivery partner
                </button>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="E.g. House 4B on 2nd floor, leave package on shoe rack..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Coupons & Bill Details */}
          <aside id="cart-bill-section">
            {/* Apply Coupon Card */}
            <div className="cart-card-v2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Tag size={16} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Coupons & Offers
                </h4>
              </div>

              {applied ? (
                <div
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>{applied.code} Applied</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '1px' }}>
                      Saving {money(applied.discount)} on your bill
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      disabled={applying || !coupon.trim()}
                      onClick={() => apply()}
                      style={{
                        padding: '0 16px',
                        borderRadius: '10px',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: applying || !coupon.trim() ? 'not-allowed' : 'pointer',
                        opacity: applying || !coupon.trim() ? 0.6 : 1
                      }}
                    >
                      {applying ? 'Applying…' : 'APPLY'}
                    </button>
                  </div>

                  {/* Quick coupon chips */}
                  {availableCoupons.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {availableCoupons.map((c) => (
                        <button
                          key={c.id || c.code}
                          type="button"
                          onClick={() => apply(c.code)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px dashed #059669',
                            color: '#059669',
                            cursor: 'pointer'
                          }}
                        >
                          Use {c.code}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bill Summary Card */}
            <div className="cart-card-v2">
              <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Bill Details
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {/* MRP Total */}
                {mrpTotal > subtotal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Items Total (MRP)</span>
                    <del>{money(mrpTotal)}</del>
                  </div>
                )}

                {/* Product Savings */}
                {productSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Product Discount</span>
                    <span>-{money(productSavings)}</span>
                  </div>
                )}

                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <span>Item Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>

                {/* Delivery Fee */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Delivery Fee</span>
                    {freeThreshold > 0 && (
                      <small style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Free on orders above {money(freeThreshold)}
                      </small>
                    )}
                  </div>
                  <b>
                    {deliveryFee === 0 ? (
                      <span style={{ color: '#059669', fontWeight: 800 }}>FREE</span>
                    ) : (
                      money(deliveryFee)
                    )}
                  </b>
                </div>

                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                    <span>Coupon Savings ({applied.code})</span>
                    <span>-{money(couponDiscount)}</span>
                  </div>
                )}

                {/* Grand Total Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    marginTop: '4px',
                    borderTop: '1.5px solid #e2e8f0',
                    fontSize: '16px',
                    fontWeight: 900,
                    color: '#0f172a'
                  }}
                >
                  <span>To Pay</span>
                  <span style={{ color: '#059669' }}>{money(total)}</span>
                </div>
              </div>

              {/* Quality Guarantee Shield */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: '#475569',
                  lineHeight: 1.4
                }}
              >
                <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
                <span><b>Quality & Freshness Guarantee:</b> 100% refund or free replacement for any damaged or missing item.</span>
              </div>

              {/* Desktop Checkout Button */}
              <div style={{ marginTop: '16px' }} className="desktop-only-action">
                <Button
                  className="wide"
                  disabled={minimumRemaining > 0}
                  onClick={handleProceed}
                  style={{
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    borderRadius: '12px',
                    background: minimumRemaining > 0 ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: minimumRemaining > 0 ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  {minimumRemaining > 0 ? (
                    `Add ${money(minimumRemaining)} more to proceed`
                  ) : (
                    <span>Proceed to Checkout · Pay {money(total)} →</span>
                  )}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (Zepto / Blinkit Production Style) */}
      {!hasModalOpen && (
        <div className="mobile-sticky-checkout-bar">
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }} onClick={scrollToBill} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                {money(total)}
              </span>
              {totalSavings > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    background: '#ecfdf5',
                    color: '#059669',
                    padding: '1px 6px',
                    borderRadius: '6px'
                  }}
                >
                  Saved {money(totalSavings)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scrollToBill(); }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '11px',
                fontWeight: 700,
                color: '#059669',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              View Bill Details ▲
            </button>
          </div>

          <button
            type="button"
            disabled={minimumRemaining > 0}
            onClick={handleProceed}
            style={{
              height: '44px',
              padding: '0 20px',
              borderRadius: '12px',
              background: minimumRemaining > 0 ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              cursor: minimumRemaining > 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: minimumRemaining > 0 ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.35)',
              flexShrink: 0
            }}
          >
            {minimumRemaining > 0 ? (
              `Add ${money(minimumRemaining)}`
            ) : (
              <>
                <span>Proceed to Pay</span>
                <ChevronRight size={16} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
export default CartPage;
