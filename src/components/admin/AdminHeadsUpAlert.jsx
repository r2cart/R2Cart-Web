import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, X, Sparkles, Volume2 } from 'lucide-react';
import { playNotificationSound } from '../../services/pushNotification.service';

export default function AdminHeadsUpAlert({ orderAlert, onClose, basePath = '/admin' }) {
  const nav = useNavigate();

  useEffect(() => {
    if (orderAlert) {
      playNotificationSound();
    }
  }, [orderAlert]);

  if (!orderAlert) return null;

  const orderNumber = orderAlert.orderNumber || 'New Order';
  const total = orderAlert.total ? `₹${orderAlert.total}` : '';
  const customerName = orderAlert.customerName && orderAlert.customerName !== 'Customer' ? orderAlert.customerName : null;
  const itemsCount = orderAlert.itemsCount ? `${orderAlert.itemsCount} ${orderAlert.itemsCount > 1 ? 'items' : 'item'}` : '';
  const time = orderAlert.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const targetUrl = orderAlert.url || `${basePath}/orders`;

  const handleView = () => {
    onClose();
    nav(targetUrl);
  };

  return (
    <>
      <style>{`
        @keyframes headsUpSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-24px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes alertLivePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.7;
          }
        }
        @keyframes alertBorderGlow {
          0%, 100% {
            border-color: rgba(52, 211, 153, 0.7);
            box-shadow: 0 16px 36px -4px rgba(2, 44, 34, 0.65), 0 0 20px rgba(16, 185, 129, 0.35);
          }
          50% {
            border-color: rgba(253, 224, 71, 0.85);
            box-shadow: 0 16px 40px -4px rgba(2, 44, 34, 0.85), 0 0 28px rgba(245, 158, 11, 0.45);
          }
        }
        .r2cart-headsup-container {
          position: fixed;
          top: 12px;
          right: 16px;
          z-index: 999999;
          width: calc(100vw - 32px);
          max-width: 440px;
          background: linear-gradient(135deg, #044E38 0%, #022C22 100%);
          color: #ffffff;
          border-radius: 16px;
          padding: 14px 16px;
          border: 1.5px solid rgba(52, 211, 153, 0.7);
          box-shadow: 0 16px 36px -4px rgba(2, 44, 34, 0.75);
          animation: headsUpSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1), alertBorderGlow 3s infinite;
          backdrop-filter: blur(12px);
          font-family: inherit;
        }
        @media (max-width: 768px) {
          .r2cart-headsup-container {
            top: 10px;
            left: 10px;
            right: 10px;
            width: calc(100% - 20px);
            max-width: none;
            padding: 12px 14px;
          }
        }
      `}</style>

      <div className="r2cart-headsup-container" role="alert" aria-live="assertive">
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444',
                animation: 'alertLivePulse 1.2s infinite ease-in-out'
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.6px',
                color: '#FEF08A',
                textTransform: 'uppercase'
              }}
            >
              LIVE ORDER RECEIVED!
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => playNotificationSound()}
              title="Re-play sound alert"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#A7F3D0',
                borderRadius: '6px',
                width: '26px',
                height: '26px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
              aria-label="Play sound again"
            >
              <Volume2 size={13} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '2px',
                display: 'grid',
                placeItems: 'center',
                lineHeight: 1
              }}
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Core Order Information Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.22)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              display: 'grid',
              placeItems: 'center',
              color: '#34D399',
              flexShrink: 0
            }}
          >
            <ShoppingBag size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                #{orderNumber}
              </span>
              {total && (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#FEF08A',
                    background: 'rgba(254, 240, 138, 0.15)',
                    padding: '1px 7px',
                    borderRadius: '6px'
                  }}
                >
                  {total}
                </span>
              )}
            </div>

            <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {customerName ? <span>By <b>{customerName}</b></span> : <span>New customer order</span>}
              {itemsCount && <span style={{ color: '#94A3B8' }}>• {itemsCount}</span>}
              <span style={{ color: '#6EE7B7', fontSize: '11px', marginLeft: 'auto' }}>⏰ {time}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={handleView}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#022C22',
              fontWeight: 800,
              fontSize: '12.5px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
            }}
          >
            <span>View &amp; Accept Order</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#E5E7EB',
              fontWeight: 600,
              fontSize: '12px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}

