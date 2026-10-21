import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Calendar,
  Zap,
  Bell,
  ArrowRight,
  Copy,
  CheckCheck,
  MapPin,
  Package,
  ShieldCheck,
  Clock,
  ShoppingBag,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { EmptyState, money } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { addressText } from '../../utils/address';
import {
  subscribeToPush,
  triggerSystemNotification,
  isPushSupported
} from '../../services/pushNotification.service';

export function OrderSuccessPage() {
  const { deliveryConfig, notify } = useApp();
  const [subscribed, setSubscribed] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [copied, setCopied] = useState(false);
  const last = JSON.parse(sessionStorage.getItem('last-order') || 'null');

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribeToPush({ role: 'CUSTOMER' }).then(() => setSubscribed(true)).catch(() => {});
      if (last) {
        triggerSystemNotification({
          title: '🎉 Order Confirmed · R2Cart',
          body: `Order #${last.orderNumber || last.id} placed for ${money(
            last.total ?? last.grandTotal
          )}. Groceries are being prepared!`,
          url: `/orders/${last.id}`,
          tag: `order-placed-${last.id}`
        });
      }
    }
  }, []);

  if (!last) {
    return (
      <div className="container page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon="package"
          title="No recent order found"
          text="You haven't placed an order in this session yet."
          action="Start shopping"
        />
      </div>
    );
  }

  const snapshot = last.address || last.addressSnapshot;
  const address = addressText(snapshot);
  const isScheduled = last.deliveryType === 'SCHEDULED';
  const eta = snapshot?.deliveryZone?.estimatedDelivery || deliveryConfig?.estimatedDelivery || '15–25 mins';
  const orderNum = last.orderNumber || last.id;
  const items = Array.isArray(last.items) ? last.items : [];
  const grandTotal = last.grandTotal ?? last.total ?? 0;

  const copyOrderId = () => {
    if (orderNum) {
      navigator.clipboard.writeText(String(orderNum)).then(() => {
        setCopied(true);
        if (notify) notify('Order ID copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {});
    }
  };

  const enablePush = async () => {
    const res = await subscribeToPush({ role: 'CUSTOMER' });
    if (res?.success) {
      setSubscribed(true);
      if (notify) notify('Live updates enabled!');
    }
  };

  return (
    <>
      <style>{`
        .order-success-container {
          max-width: 580px;
          margin: 0 auto;
          padding: 24px 16px 80px;
          box-sizing: border-box;
          width: 100%;
        }

        @keyframes popGlow {
          0% {
            transform: scale(0.6);
            opacity: 0;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          60% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 0 14px rgba(16, 185, 129, 0);
          }
        }

        @keyframes floatConfetti {
          0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-40px) rotate(180deg); opacity: 0; }
        }

        @keyframes liveRadar {
          0% { transform: scale(0.9); opacity: 0.9; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.9; }
        }

        .success-hero-badge {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          animation: popGlow 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
        }

        .success-hero-badge::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px dashed rgba(16, 185, 129, 0.35);
        }

        .success-card-block {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          padding: 16px 18px;
          margin-bottom: 14px;
          box-sizing: border-box;
          width: 100%;
        }

        .tracker-step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          z-index: 2;
        }

        .tracker-step-dot.done {
          background: #059669;
          color: #ffffff;
        }

        .tracker-step-dot.active {
          background: #ecfdf5;
          color: #059669;
          border: 2px solid #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.15);
        }

        .tracker-step-dot.pending {
          background: #f1f5f9;
          color: #94a3b8;
          border: 1px solid #cbd5e1;
        }

        .btn-track-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: #ffffff !important;
          font-weight: 800;
          font-size: 14.5px;
          padding: 13px 20px;
          border-radius: 12px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }

        .btn-track-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(5, 150, 105, 0.35);
        }

        .btn-continue-ghost {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #ffffff;
          color: #334155 !important;
          border: 1px solid #cbd5e1;
          font-weight: 700;
          font-size: 13.5px;
          padding: 11px 18px;
          border-radius: 12px;
          text-decoration: none;
          transition: background 0.15s ease;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }

        .btn-continue-ghost:hover {
          background: #f8fafc;
        }
      `}</style>

      <div className="order-success-container">
        {/* Celebration Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="success-hero-badge">
            <Check size={38} strokeWidth={3} />
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
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}
          >
            <Sparkles size={13} color="#059669" />
            <span>Order Placed Successfully</span>
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 6px',
              letterSpacing: '-0.4px'
            }}
          >
            {isScheduled ? 'Order Scheduled! 📅' : 'Freshness is on the way! ⚡'}
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.45
            }}
          >
            {isScheduled
              ? `Delivery booked for ${last.deliveryDate} during ${last.deliverySlot}.`
              : `We’ve received your order and started packing it with care.`}
          </p>
        </div>

        {/* Live Delivery Tracker Card */}
        <div
          className="success-card-block"
          style={{
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1.5px solid #a7f3d0'
          }}
        >
          {/* Tracker Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isScheduled ? <Calendar size={17} /> : <Zap size={17} />}
              </div>
              <div>
                <b style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                  {isScheduled ? 'Scheduled Delivery' : `Estimated Arrival in ${eta}`}
                </b>
                <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>
                  {isScheduled ? `${last.deliveryDate} · ${last.deliverySlot}` : '⚡ Lightning Quick Delivery'}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '12px',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '10.5px',
                fontWeight: 800
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  animation: 'liveRadar 1.5s infinite ease-in-out'
                }}
              />
              <span>LIVE</span>
            </div>
          </div>

          {/* 4-Step Progress Indicator */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', margin: '10px 0 6px' }}>
            {/* Connecting Bar */}
            <div
              style={{
                position: 'absolute',
                top: '11px',
                left: '12%',
                right: '12%',
                height: '3px',
                background: '#e2e8f0',
                zIndex: 1
              }}
            >
              <div
                style={{
                  width: '33%',
                  height: '100%',
                  background: '#059669',
                  borderRadius: '2px'
                }}
              />
            </div>

            {/* Step 1: Placed */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div className="tracker-step-dot done">
                <Check size={13} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                Placed
              </span>
              <small style={{ fontSize: '9px', color: '#64748b' }}>Just now</small>
            </div>

            {/* Step 2: Packing */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div className="tracker-step-dot active">
                <Package size={12} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                Packing
              </span>
              <small style={{ fontSize: '9px', color: '#059669', fontWeight: 700 }}>Next</small>
            </div>

            {/* Step 3: Out for Delivery */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div className="tracker-step-dot pending">
                <Zap size={11} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '6px' }}>
                On Way
              </span>
              <small style={{ fontSize: '9px', color: '#94a3b8' }}>Rider</small>
            </div>

            {/* Step 4: Delivered */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div className="tracker-step-dot pending">
                <Check size={11} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '6px' }}>
                Delivered
              </span>
              <small style={{ fontSize: '9px', color: '#94a3b8' }}>Doorstep</small>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
          <Link className="btn-track-primary" to={`/orders/${last.id}`}>
            <span>Track Live Order & Chat</span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
          <Link className="btn-continue-ghost" to="/">
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Order Details Summary Card */}
        <div className="success-card-block">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Order Summary</b>
            <button
              type="button"
              onClick={copyOrderId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '4px 9px',
                borderRadius: '7px',
                fontSize: '11px',
                color: copied ? '#059669' : '#475569',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Copy Order ID"
            >
              {copied ? <CheckCheck size={13} color="#059669" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : `#${orderNum}`}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
            {/* Payment Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Payment Mode</span>
              <div style={{ textAlign: 'right' }}>
                <b style={{ color: '#0f172a' }}>Cash on Delivery (COD)</b>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                  Pay {money(grandTotal)} upon delivery
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                <MapPin size={15} color="#059669" />
                <span>Deliver to</span>
              </div>
              <div style={{ textAlign: 'right', maxWidth: '65%' }}>
                <b style={{ color: '#0f172a', display: 'block' }}>
                  {snapshot?.name || snapshot?.fullName || 'Customer'}{' '}
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: '#dcfce7',
                      color: '#15803d',
                      textTransform: 'uppercase'
                    }}
                  >
                    {snapshot?.type || 'Home'}
                  </span>
                </b>
                <span style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.35 }}>
                  {address.line}
                  {address.cityLine && `, ${address.cityLine}`}
                </span>
              </div>
            </div>

            {/* Delivery Instructions (If any) */}
            {last.deliveryInstruction && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
                <span style={{ color: '#64748b' }}>Rider Note</span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#047857',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  📝 {last.deliveryInstruction}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Items Preview */}
        {items.length > 0 && (
          <div className="success-card-block">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <b style={{ fontSize: '13.5px', color: '#0f172a' }}>
                Items Ordered ({items.length})
              </b>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                {items.reduce((s, i) => s + (i.quantity || i.qty || 1), 0)} units
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.slice(0, 4).map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    paddingBottom: idx === Math.min(items.length, 4) - 1 ? 0 : '8px',
                    borderBottom: idx === Math.min(items.length, 4) - 1 ? 'none' : '1px solid #f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', background: '#f8fafc', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Package size={15} />
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: '12px', color: '#1e293b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </b>
                      <small style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {item.unit || 'Pack'} · Qty: {item.quantity || item.qty}
                      </small>
                    </div>
                  </div>

                  <b style={{ fontSize: '12px', color: '#0f172a', flexShrink: 0 }}>
                    {money(item.price * (item.quantity || item.qty))}
                  </b>
                </div>
              ))}

              {items.length > 4 && (
                <div style={{ textAlign: 'center', paddingTop: '6px', fontSize: '11.5px', color: '#64748b' }}>
                  + {items.length - 4} more items in order
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Updates Push Notification Alert Banner */}
        {isPushSupported() && !subscribed && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #a7f3d0',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Bell size={17} />
              </div>
              <div>
                <b style={{ fontSize: '12.5px', color: '#15803d', display: 'block' }}>
                  Turn on Live Rider & Order Alerts
                </b>
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  Get notified when rider is arriving at your door.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={enablePush}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Enable
            </button>
          </div>
        )}



        {/* Quality Guarantee & Support Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '11.5px',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>100% Quality Checked & Sealed</span>
          </div>

          <Link
            to="/support"
            style={{
              color: '#059669',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MessageSquare size={13} />
            <span>Need Help?</span>
          </Link>
        </div>
      </div>
    </>
  );
}
