import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function FloatingBottomCartBar() {
  const { cartItems, subtotal, mrpTotal, activeDeliveryRules, deliveryConfig } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [bouncing, setBouncing] = useState(false);
  const prevCountRef = useRef(0);

  const count = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const savings = mrpTotal > subtotal ? mrpTotal - subtotal : 0;
  const rules = activeDeliveryRules || deliveryConfig;
  const freeThreshold = Number(rules?.freeDeliveryThreshold || 0);
  const diffForFree = freeThreshold > subtotal ? freeThreshold - subtotal : 0;

  // Track item additions to trigger subtle bounce animation
  useEffect(() => {
    if (count > prevCountRef.current && prevCountRef.current > 0) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 400);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  // Don't render if cart is empty
  if (count <= 0) return null;

  // Don't render on specific routes where user is already viewing cart or checking out
  const path = location.pathname;
  const hiddenRoutes = [
    '/cart',
    '/checkout',
    '/order-success',
    '/login',
    '/signup',
    '/verify-otp',
    '/forgot-password'
  ];
  if (hiddenRoutes.includes(path) || path.startsWith('/admin') || path.startsWith('/super-admin') || path.startsWith('/delivery')) {
    return null;
  }

  // Get up to 3 mini product image thumbnails for Zepto-style stacked preview
  const previewThumbs = cartItems.slice(0, 3);

  return (
    <>
      <style>{`
        @keyframes zeptoBarSlideUp {
          0% {
            opacity: 0;
            transform: translate3d(-50%, 40px, 0) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate3d(-50%, 0, 0) scale(1);
          }
        }
        @keyframes zeptoBarSlideUpMobile {
          0% {
            opacity: 0;
            transform: translate3d(0, 40px, 0) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes zeptoCartBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .floating-bottom-cart-bar {
          position: fixed;
          z-index: 75;
          cursor: pointer;
          user-select: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          animation: zeptoBarSlideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: min(92vw, 480px);
        }
        .floating-bottom-cart-bar:hover {
          transform: translateX(-50%) translateY(-2px);
          box-shadow: 0 20px 42px -6px rgba(5, 150, 105, 0.55), 0 8px 16px rgba(0, 0, 0, 0.2) !important;
        }
        .floating-bottom-cart-bar:active {
          transform: translateX(-50%) scale(0.98);
        }
        @media (max-width: 820px) {
          .floating-bottom-cart-bar {
            bottom: calc(56px + max(8px, env(safe-area-inset-bottom)) + 8px) !important;
            left: 12px !important;
            right: 12px !important;
            transform: none !important;
            width: calc(100% - 24px) !important;
            max-width: 480px !important;
            margin: 0 auto !important;
            animation: zeptoBarSlideUpMobile 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          .floating-bottom-cart-bar:hover {
            transform: translateY(-2px) !important;
          }
          .floating-bottom-cart-bar:active {
            transform: scale(0.98) !important;
          }
        }
      `}</style>

      <div
        className="floating-bottom-cart-bar"
        onClick={() => navigate('/cart')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/cart');
          }
        }}
        aria-label={`View cart with ${count} items, total ₹${subtotal}`}
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 55%, #064e3b 100%)',
          borderRadius: '16px',
          padding: '10px 14px',
          boxShadow: '0 16px 36px -6px rgba(5, 150, 105, 0.45), 0 4px 14px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          animation: bouncing
            ? 'zeptoCartBounce 0.35s ease'
            : undefined
        }}
      >
        {/* Left Side: Thumbnails Stack + Cart Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Thumbnails stack or Cart Icon */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
            {previewThumbs.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                {previewThumbs.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1.5px solid #ffffff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      marginLeft: idx > 0 ? '-12px' : '0',
                      zIndex: 3 - idx,
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 fill=%22%23ecfdf5%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22%3E🛒%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff'
                }}
              >
                <ShoppingCart size={18} strokeWidth={2.2} />
              </div>
            )}
          </div>

          {/* Item Count & Subtotal Text */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{count} {count === 1 ? 'ITEM' : 'ITEMS'}</span>
              <span style={{ opacity: 0.75, fontSize: '12px' }}>·</span>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                ₹{Number(subtotal || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: rules?.isPaused ? '#fca5a5' : savings > 0 ? '#fef08a' : freeThreshold > 0 && diffForFree === 0 ? '#a7f3d0' : 'rgba(255, 255, 255, 0.85)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '1px'
              }}
            >
              {rules?.isPaused ? (
                <span>🚫 Delivery paused in {rules?.villageName || rules?.name || 'selected area'}</span>
              ) : savings > 0 ? (
                <>
                  <Sparkles size={11} color="#fef08a" />
                  <span>Saved ₹{Number(savings).toLocaleString('en-IN')} on MRP</span>
                </>
              ) : freeThreshold > 0 && diffForFree === 0 ? (
                <span>🎉 Free delivery unlocked!</span>
              ) : freeThreshold > 0 && diffForFree > 0 ? (
                <span>Add ₹{diffForFree} more for free delivery</span>
              ) : (
                <span>⚡ Instant delivery to your door</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: View Cart Action Pill Button */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            color: '#065f46',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            flexShrink: 0,
            letterSpacing: '0.2px'
          }}
        >
          <span>View Cart</span>
          <ArrowRight size={15} strokeWidth={2.5} />
        </div>
      </div>
    </>
  );
}
