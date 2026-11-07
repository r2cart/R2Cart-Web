import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, X, Volume2, XCircle } from 'lucide-react';
import { playNotificationSound } from '../../services/pushNotification.service';

export default function AdminHeadsUpAlert({ orderAlert, onClose, basePath = '/admin' }) {
  const nav = useNavigate();

  useEffect(() => {
    if (orderAlert) {
      playNotificationSound();
    }
  }, [orderAlert]);

  if (!orderAlert) return null;

  const isCancelled = Boolean(orderAlert.isCancelled);
  const orderNumber = orderAlert.orderNumber || 'Order';
  const total = orderAlert.total ? `₹${orderAlert.total}` : '';
  const customerName = orderAlert.customerName && orderAlert.customerName !== 'Customer' ? orderAlert.customerName : null;
  const reason = orderAlert.reason || '';
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
        @keyframes alertBorderGlowGreen {
          0%, 100% {
            border-color: rgba(52, 211, 153, 0.7);
            box-shadow: 0 16px 36px -4px rgba(2, 44, 34, 0.65), 0 0 20px rgba(16, 185, 129, 0.35);
          }
          50% {
            border-color: rgba(253, 224, 71, 0.85);
            box-shadow: 0 16px 40px -4px rgba(2, 44, 34, 0.85), 0 0 28px rgba(245, 158, 11, 0.45);
          }
        }
        @keyframes alertBorderGlowRed {
          0%, 100% {
            border-color: rgba(248, 113, 113, 0.8);
            box-shadow: 0 16px 36px -4px rgba(69, 10, 10, 0.8), 0 0 24px rgba(239, 68, 68, 0.45);
          }
          50% {
            border-color: rgba(252, 165, 165, 1);
            box-shadow: 0 16px 40px -4px rgba(69, 10, 10, 0.95), 0 0 32px rgba(239, 68, 68, 0.65);
          }
        }
        .r2cart-headsup-container {
          position: fixed;
          top: 12px;
          right: 16px;
          z-index: 999999;
          width: calc(100vw - 32px);
          max-width: 440px;
          color: #ffffff;
          border-radius: 16px;
          padding: 14px 16px;
          animation: headsUpSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
          font-family: inherit;
        }
        .r2cart-headsup-container.order-new {
          background: linear-gradient(135deg, #044E38 0%, #022C22 100%);
          border: 1.5px solid rgba(52, 211, 153, 0.7);
          box-shadow: 0 16px 36px -4px rgba(2, 44, 34, 0.75);
          animation: headsUpSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1), alertBorderGlowGreen 3s infinite;
        }
        .r2cart-headsup-container.order-cancelled {
          background: linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%);
          border: 1.5px solid rgba(248, 113, 113, 0.8);
          box-shadow: 0 16px 36px -4px rgba(69, 10, 10, 0.85);
          animation: headsUpSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1), alertBorderGlowRed 2.5s infinite;
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

      <div
        className={`r2cart-headsup-container ${isCancelled ? 'order-cancelled' : 'order-new'}`}
        role="alert"
        aria-live="assertive"
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isCancelled ? '#FCA5A5' : '#EF4444',
                animation: 'alertLivePulse 1.2s infinite ease-in-out'
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.6px',
                color: isCancelled ? '#FECACA' : '#FEF08A',
                textTransform: 'uppercase'
              }}
            >
              {isCancelled ? '❌ ORDER CANCELLED BY CUSTOMER' : 'LIVE ORDER RECEIVED!'}
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => playNotificationSound()}
              title="Re-play sound alert"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: isCancelled ? '#FECACA' : '#A7F3D0',
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
              background: isCancelled ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.22)',
              border: isCancelled ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid rgba(52, 211, 153, 0.35)',
              display: 'grid',
              placeItems: 'center',
              color: isCancelled ? '#F87171' : '#34D399',
              flexShrink: 0
            }}
          >
            {isCancelled ? <XCircle size={24} /> : <ShoppingBag size={22} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                #{orderNumber}
              </span>
              {isCancelled ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FECACA',
                    background: 'rgba(220, 38, 38, 0.4)',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    padding: '1px 7px',
                    borderRadius: '6px'
                  }}
                >
                  CANCELLED
                </span>
              ) : (
                total && (
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
                )
              )}
            </div>

            <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {customerName ? <span>By <b>{customerName}</b></span> : <span>Customer</span>}
              {itemsCount && <span style={{ color: isCancelled ? '#FCA5A5' : '#94A3B8' }}>• {itemsCount}</span>}
              <span style={{ color: isCancelled ? '#FECACA' : '#6EE7B7', fontSize: '11px', marginLeft: 'auto' }}>⏰ {time}</span>
            </div>

            {isCancelled && (
              <div style={{ fontSize: '11.5px', color: '#FEE2E2', marginTop: '3px', lineHeight: 1.3 }}>
                {reason ? <span>Reason: <i>"{reason}"</i> · </span> : null}
                <span style={{ color: '#A7F3D0', fontWeight: 600 }}>Stock restored to inventory</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={handleView}
            style={{
              flex: 1,
              background: isCancelled
                ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: isCancelled ? '#FFFFFF' : '#022C22',
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
              boxShadow: isCancelled
                ? '0 4px 12px rgba(220, 38, 38, 0.45)'
                : '0 4px 12px rgba(16, 185, 129, 0.35)'
            }}
          >
            <span>{isCancelled ? 'View Order Details' : 'View & Accept Order'}</span>
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
