import { useEffect, useState, useMemo } from 'react';
import {
  Banknote,
  Calendar,
  Check,
  Clock,
  ShieldCheck,
  Tag,
  Zap,
  MapPin,
  Clock3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AddressForm } from '../../layouts/CustomerLayout';
import { Badge, Button, EmptyState, Modal, money } from '../../components/ui';
import { orderService } from '../../services/order.service';
import { customerService } from '../../services/customer.service';
import { catalogService } from '../../services/catalog.service';
import { addressPayload, addressView } from '../../utils/address';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Slot', time: '07:00 AM - 10:00 AM', endHour: 10 },
  { id: 'midday', label: 'Midday Slot', time: '10:00 AM - 01:00 PM', endHour: 13 },
  { id: 'afternoon', label: 'Afternoon Slot', time: '01:00 PM - 04:00 PM', endHour: 16 },
  { id: 'evening', label: 'Evening Slot', time: '04:00 PM - 07:00 PM', endHour: 19 },
  { id: 'night', label: 'Night Slot', time: '07:00 PM - 10:00 PM', endHour: 22 }
];

const PRESET_INSTRUCTIONS = [
  { id: 'no-bell', label: "Don't ring bell", sub: 'Drop and avoid noise', icon: '🔕' },
  { id: 'at-door', label: 'Leave at door', sub: 'Place outside doorstep', icon: '🚪' },
  { id: 'call-first', label: 'Call on arrival', sub: 'Rider calls upon arrival', icon: '📞' },
  { id: 'with-guard', label: 'Leave with guard', sub: 'Security desk / gate', icon: '🛡️' }
];

function isSlotAvailable(slot, isToday) {
  if (!isToday) return true;
  const currentHour = new Date().getHours();
  return currentHour < slot.endHour - 1;
}

function getAvailableDates(holidayDates = []) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const id = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const isHoliday = Array.isArray(holidayDates) && holidayDates.includes(id);
    const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const label = `${dayName}, ${dateFormatted}`;
    const hasAvailableSlot = !isHoliday && (isToday ? TIME_SLOTS.some((s) => isSlotAvailable(s, true)) : true);
    dates.push({
      id,
      dayName,
      dateFormatted,
      label,
      isToday,
      isTomorrow,
      isHoliday,
      hasAvailableSlot
    });
  }
  return dates;
}

export function CheckoutPage() {
  const {
    cartItems,
    subtotal,
    mrpTotal,
    addressList,
    setAddressList,
    setOrderList,
    setCart,
    notify,
    deliveryConfig,
    deliveryZones,
    deliveryRulesFor,
    user,
    openAuthModal,
    refreshProducts,
    storeSettings,
    activeAddress,
    setActiveAddress,
    activeDeliveryRules,
    setLocationOpen
  } = useApp();

  const emergencyPause = storeSettings?.policies?.emergencyPause;
  const effectiveStatus = storeSettings?.effectiveStatus;
  const isEmergencyActive = Boolean(emergencyPause?.isPaused) || effectiveStatus?.storeStatus === 'EMERGENCY_PAUSED';
  const allowImmediate = effectiveStatus ? Boolean(effectiveStatus.allowImmediateOrders) : true;
  const allowScheduled = effectiveStatus ? Boolean(effectiveStatus.allowScheduledOrders) : true;
  const holidayDates = Array.isArray(emergencyPause?.holidayDates) ? emergencyPause.holidayDates : [];

  const nav = useNavigate();
  const [selected, setSelected] = useState(() => activeAddress?.id || null);
  const [placing, setPlacing] = useState(false);
  const [addressModal, setAddressModal] = useState(false);

  // Delivery instructions state
  const [selectedInstructions, setSelectedInstructions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('grocify-delivery-instruction-presets');
      return saved ? JSON.parse(saved) : ['Call on arrival'];
    } catch {
      return ['Call on arrival'];
    }
  });
  const [customNote, setCustomNote] = useState(() => sessionStorage.getItem('grocify-custom-note') || '');

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [applying, setApplying] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(() => {
    const code = sessionStorage.getItem('grocify-coupon');
    const discount = Number(sessionStorage.getItem('grocify-coupon-discount') || 0);
    return code ? { code, discount } : null;
  });

  // Scheduling state
  const dates = useMemo(() => getAvailableDates(holidayDates), [holidayDates]);
  const [deliveryType, setDeliveryType] = useState(() => {
    if (effectiveStatus && !effectiveStatus.allowImmediateOrders && effectiveStatus.allowScheduledOrders) {
      return 'SCHEDULED';
    }
    return 'INSTANT';
  });

  useEffect(() => {
    if (!allowImmediate && allowScheduled && deliveryType !== 'SCHEDULED') {
      setDeliveryType('SCHEDULED');
    }
  }, [allowImmediate, allowScheduled, deliveryType]);

  const [selectedDate, setSelectedDate] = useState(() => {
    return dates.find((d) => d.hasAvailableSlot) || dates[1] || dates[0];
  });
  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(() => {
    const isToday = dates[0]?.hasAvailableSlot;
    return TIME_SLOTS.find((s) => isSlotAvailable(s, isToday)) || TIME_SLOTS[0];
  });

  // Require login on checkout
  useEffect(() => {
    if (!user && !localStorage.getItem('grocify-access-token')) {
      sessionStorage.setItem('grocify-auth-redirect', '/checkout');
      openAuthModal('order');
      nav('/cart', { replace: true });
    }
  }, [user]);

  // Load slots for selected date
  useEffect(() => {
    let mounted = true;
    if (selectedDate?.id) {
      catalogService
        .listDeliverySlots(selectedDate.id)
        .then((slots) => {
          if (!mounted) return;
          if (Array.isArray(slots) && slots.length > 0) {
            setDynamicSlots(slots);
            setSelectedSlot((curr) => {
              const match = slots.find((s) => (s.id === curr?.id || s.label === curr?.label || s.label === curr?.time) && s.isAvailable);
              return match || slots.find((s) => s.isAvailable) || slots[0];
            });
          } else {
            setDynamicSlots([]);
          }
        })
        .catch(() => {
          if (mounted) setDynamicSlots([]);
        });
    }
    return () => { mounted = false; };
  }, [selectedDate?.id]);

  // Auto select default address
  useEffect(() => {
    if (addressList.length > 0) {
      const currentExists = selected && addressList.some((item) => item.id === selected);
      if (!currentExists) {
        const available = addressList.filter((item) => Boolean(deliveryRulesFor(item.area)));
        const nextId = activeAddress?.id && available.some((a) => a.id === activeAddress.id)
          ? activeAddress.id
          : available.find((item) => item.default)?.id || available[0]?.id;
        setSelected(nextId);
        const nextAddr = addressList.find((a) => a.id === nextId);
        if (nextAddr) setActiveAddress(nextAddr);
      }
    }
  }, [addressList, deliveryZones, selected, activeAddress?.id]);

  // Sync selected address whenever activeAddress updates (e.g. from LocationModal)
  useEffect(() => {
    if (activeAddress?.id && selected !== activeAddress.id) {
      setSelected(activeAddress.id);
    }
  }, [activeAddress?.id]);

  // Load available coupons
  useEffect(() => {
    let active = true;
    customerService
      .coupons()
      .then((rows) => {
        if (!active) return;
        setCoupons(Array.isArray(rows) ? rows : rows?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCouponLoading(false);
      });
    return () => { active = false; };
  }, [subtotal]);

  if (!cartItems.length) {
    return (
      <div className="container page narrow-page" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <EmptyState
          icon="cart"
          title="No items in basket"
          text="Please add fresh groceries from our store before proceeding to checkout."
          action="Browse Catalogue"
          to="/"
        />
      </div>
    );
  }

  const selectedAddress = addressList.find((item) => item.id === selected) || activeAddress;
  const rules = (selectedAddress?.area ? deliveryRulesFor(selectedAddress.area) : null) || activeDeliveryRules || deliveryConfig;
  const deliveryFee = subtotal >= rules.freeDeliveryThreshold ? 0 : rules.deliveryFee;
  const total = Math.max(0, subtotal + deliveryFee - (coupon?.discount || 0));
  const minimumRemaining = Math.max(0, rules.minimumOrder - subtotal);
  const productSavings = Math.max(0, Number(mrpTotal || 0) - Number(subtotal || 0));
  const totalSavings = productSavings + (coupon?.discount || 0);

  const toggleInstruction = (label) => {
    setSelectedInstructions((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const applyCouponCode = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return notify('Please enter a coupon code', 'error');
    setApplying(code);
    try {
      const result = await customerService.validateCoupon(code);
      const next = { code: result.code, discount: Number(result.discount) };
      setCoupon(next);
      setCouponInput('');
      sessionStorage.setItem('grocify-coupon', next.code);
      sessionStorage.setItem('grocify-coupon-discount', String(next.discount));
      notify(`Coupon ${next.code} applied! You save ${money(next.discount)}`);
    } catch (error) {
      notify(error.message || 'Invalid coupon code', 'error');
    } finally {
      setApplying('');
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    sessionStorage.removeItem('grocify-coupon');
    sessionStorage.removeItem('grocify-coupon-discount');
    notify('Coupon removed');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (!isSlotAvailable(selectedSlot, date.isToday)) {
      const firstAvail = TIME_SLOTS.find((s) => isSlotAvailable(s, date.isToday));
      if (firstAvail) setSelectedSlot(firstAvail);
    }
  };

  const placeOrder = async () => {
    if (isEmergencyActive) {
      return notify(effectiveStatus?.statusReason || emergencyPause?.message || 'Store orders are temporarily paused. Please check back shortly.', 'error');
    }
    if (deliveryType === 'INSTANT' && !allowImmediate) {
      return notify(effectiveStatus?.statusReason || 'Store is currently closed for instant delivery. Please select a scheduled delivery slot.', 'error');
    }
    if (deliveryType === 'SCHEDULED' && !allowScheduled) {
      return notify('Scheduled orders are currently unavailable.', 'error');
    }
    if (deliveryType === 'SCHEDULED' && holidayDates.includes(selectedDate?.id)) {
      return notify('Deliveries are closed on this date due to a store holiday.', 'error');
    }
    if (placing) return;
    if (!selected || !selectedAddress) {
      notify('Please select or add your delivery address', 'error');
      setAddressModal(true);
      return;
    }
    if (!deliveryRulesFor(selectedAddress.area)) {
      return notify(`Delivery is unavailable in ${selectedAddress.area}`, 'error');
    }
    if (rules?.allowCod === false) {
      return notify(`Cash on Delivery is currently unavailable for ${selectedAddress.area}.`, 'error');
    }
    if (minimumRemaining > 0) {
      return notify(`Add ${money(minimumRemaining)} more to reach minimum order of ${money(rules.minimumOrder)}`, 'error');
    }
    if (deliveryType === 'SCHEDULED' && (!selectedDate || !selectedSlot)) {
      return notify('Please select a valid delivery date and time slot', 'error');
    }

    const combinedInstruction = [...selectedInstructions, customNote].filter(Boolean).join('. ');

    setPlacing(true);
    try {
      const order = await orderService.create({
        addressId: String(selected),
        couponCode: coupon?.code || null,
        deliveryInstruction: combinedInstruction || 'Call before delivery',
        paymentMethod: 'COD',
        deliveryType,
        deliveryDate: deliveryType === 'SCHEDULED' ? (selectedDate?.id || selectedDate?.label) : null,
        deliverySlot: deliveryType === 'SCHEDULED' ? (selectedSlot?.label || selectedSlot?.time) : null
      });

      sessionStorage.setItem('last-order', JSON.stringify(order));
      sessionStorage.removeItem('grocify-coupon');
      sessionStorage.removeItem('grocify-coupon-discount');
      setOrderList((current) => [order, ...current]);
      setCart({});
      await refreshProducts();
      window.dispatchEvent(new Event('grocify:products-updated'));
      window.dispatchEvent(new Event('grocify:orders-updated'));
      notify('Order placed successfully! 🎉');
      nav('/order-success');
    } catch (error) {
      notify(error.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const saveAddress = async (value) => {
    try {
      const saved = addressView(await customerService.addAddress(addressPayload(value)));
      setAddressList((items) => [saved, ...items]);
      setSelected(saved.id);
      setActiveAddress(saved);
      setAddressModal(false);
      notify('Address saved successfully');
    } catch (error) {
      notify(error.message || 'Failed to save address', 'error');
    }
  };

  const slotsToRender = dynamicSlots.length > 0 ? dynamicSlots : TIME_SLOTS.map((s) => ({
    ...s,
    isAvailable: isSlotAvailable(s, selectedDate?.isToday)
  }));

  const scrollToBill = () => {
    const el = document.getElementById('checkout-bill-summary');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <style>{`
        .checkout-page-wrapper {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 12px 120px;
          box-sizing: border-box;
          width: 100%;
          overflow-x: hidden;
        }
        .checkout-grid-container {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
        }
        .checkout-grid-container > section,
        .checkout-grid-container > aside {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .checkout-card-v2 {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          padding: 18px;
          margin-bottom: 16px;
          transition: box-shadow 0.2s ease;
          box-sizing: border-box;
          max-width: 100%;
          overflow: hidden;
        }
        .checkout-step-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .checkout-step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #059669;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .checkout-step-num.done {
          background: #059669;
          color: #ffffff;
        }
        .delivery-type-card-v2 {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-sizing: border-box;
          min-width: 0;
        }
        .delivery-type-card-v2.active {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 1px #059669, 0 4px 12px rgba(5, 150, 105, 0.08);
        }
        .date-pill-v2 {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          min-width: 72px;
          text-align: center;
          box-sizing: border-box;
        }
        .date-pill-v2.active {
          background: #059669;
          border-color: #059669;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }
        .date-pill-v2.disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: #f1f5f9;
        }
        .slot-chip-v2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          box-sizing: border-box;
          min-width: 0;
        }
        .slot-chip-v2.active {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 1px #059669;
        }
        .slot-chip-v2.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }
        .mobile-checkout-sticky-footer {
          display: none;
        }
        @media (max-width: 820px) {
          .checkout-page-wrapper {
            padding: 10px 10px 110px;
          }
          .checkout-grid-container {
            grid-template-columns: 100%;
            gap: 12px;
          }
          .checkout-card-v2 {
            padding: 14px;
          }
          .delivery-type-card-v2 {
            flex: 1 1 100%;
            min-width: 0;
          }
          .mobile-checkout-sticky-footer {
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
        }
      `}</style>

      <div className="checkout-page-wrapper">
        {/* Emergency Pause Warning if Active */}
        {isEmergencyActive && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '12px 16px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <AlertCircle size={18} />
              <span>Store Orders Temporarily Paused</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#991b1b' }}>
              {effectiveStatus?.statusReason || emergencyPause?.message || 'We are temporarily not taking new orders due to high order volume. Please check back shortly.'}
            </p>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="checkout-grid-container">
          {/* Left Column: Address, Speed/Slot, Instructions, Payment */}
          <section>
            {/* Step 1: Delivery Address (Compact Quick-Commerce Style) */}
            <div
              className="checkout-card-v2"
              style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <span
                  className={`checkout-step-num ${selectedAddress ? 'done' : ''}`}
                  style={{ width: '24px', height: '24px', fontSize: '11px', flexShrink: 0 }}
                >
                  {selectedAddress ? <Check size={13} strokeWidth={3} /> : '1'}
                </span>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Deliver to
                    </span>
                    {selectedAddress && (
                      <>
                        <b style={{ fontSize: '13.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedAddress.name}
                        </b>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#dcfce7',
                            color: '#15803d',
                            textTransform: 'uppercase',
                            flexShrink: 0
                          }}
                        >
                          {selectedAddress.type || 'HOME'}
                        </span>
                      </>
                    )}
                  </div>

                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '12px',
                      color: selectedAddress ? '#475569' : '#dc2626',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3
                    }}
                    title={selectedAddress ? `${selectedAddress.line}, ${selectedAddress.cityLine || selectedAddress.city}` : 'No address selected'}
                  >
                    {selectedAddress
                      ? `${selectedAddress.line}, ${selectedAddress.cityLine || selectedAddress.city}`
                      : 'Please select a delivery address'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #a7f3d0',
                  color: '#059669',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                {selectedAddress ? 'Change' : '+ Add'}
              </button>
            </div>

            {/* Step 2: Delivery Speed & Schedule Selection */}
            <div className="checkout-card-v2">
              <div className="checkout-step-header">
                <span className="checkout-step-num done">
                  <Check size={14} strokeWidth={3} />
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Delivery Timing
                </h3>
              </div>

              {/* Speed Mode Selector Cards */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`delivery-type-card-v2 ${deliveryType === 'INSTANT' ? 'active' : ''}`}
                  onClick={() => {
                    if (!allowImmediate) {
                      return notify(effectiveStatus?.statusReason || 'Store is currently closed for instant delivery.', 'error');
                    }
                    setDeliveryType('INSTANT');
                  }}
                  style={!allowImmediate ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: deliveryType === 'INSTANT' ? '#059669' : '#ecfdf5',
                      color: deliveryType === 'INSTANT' ? '#ffffff' : '#059669',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Zap size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Instant Delivery</b>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: allowImmediate ? '#dcfce7' : '#fee2e2',
                          color: allowImmediate ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {allowImmediate ? 'Fastest' : 'Closed'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      {allowImmediate ? `Estimated in ${rules?.estimatedDelivery || '15–30 mins'}` : 'Closed outside store hours'}
                    </p>
                  </div>
                  {deliveryType === 'INSTANT' && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={`delivery-type-card-v2 ${deliveryType === 'SCHEDULED' ? 'active' : ''}`}
                  onClick={() => setDeliveryType('SCHEDULED')}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: deliveryType === 'SCHEDULED' ? '#059669' : '#f0f9ff',
                      color: deliveryType === 'SCHEDULED' ? '#ffffff' : '#0284c7',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b style={{ fontSize: '13.5px', color: '#0f172a' }}>Schedule Later</b>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: '#e0f2fe',
                          color: '#0369a1'
                        }}
                      >
                        Slot
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Choose preferred date & time
                    </p>
                  </div>
                  {deliveryType === 'SCHEDULED' && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Date & Time Pickers */}
              {deliveryType === 'SCHEDULED' && (
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#059669" /> Select Delivery Date:
                  </div>

                  {/* Dates Row */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', maxWidth: '100%', boxSizing: 'border-box', paddingBottom: '4px' }}>
                    {dates.map((d) => {
                      const isCur = selectedDate?.id === d.id;
                      const disabled = !d.hasAvailableSlot;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={disabled}
                          className={`date-pill-v2 ${isCur ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                          onClick={() => handleDateSelect(d)}
                        >
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{d.dayName}</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, marginTop: '2px' }}>{d.dateFormatted}</span>
                          {d.isHoliday ? (
                            <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 800, marginTop: '2px' }}>Holiday</span>
                          ) : disabled ? (
                            <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Closed</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#059669" /> Select Time Slot:
                  </div>

                  {/* Slots Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    {slotsToRender.map((s) => {
                      const available = Boolean(s.isAvailable);
                      const isCur = (selectedSlot?.id === s.id || selectedSlot?.label === s.label) && available;
                      const timeStr = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.time || '');

                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!available}
                          className={`slot-chip-v2 ${isCur ? 'active' : ''} ${!available ? 'disabled' : ''}`}
                          onClick={() => available && setSelectedSlot(s)}
                        >
                          <div style={{ minWidth: 0 }}>
                            <b style={{ fontSize: '12px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</b>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>{timeStr}</div>
                          </div>
                          {available && isCur && (
                            <Check size={14} color="#059669" strokeWidth={3} style={{ flexShrink: 0, marginLeft: '4px' }} />
                          )}
                          {!available && (
                            <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', flexShrink: 0 }}>
                              Closed
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Delivery Preferences & Instructions */}
            <div className="checkout-card-v2" style={{ padding: '14px' }}>
              <div className="checkout-step-header" style={{ marginBottom: '10px', paddingBottom: '10px' }}>
                <span className="checkout-step-num done" style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                  <Check size={12} strokeWidth={3} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    Delivery Instructions
                  </h3>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>
                    Guide your rider for a smooth drop-off
                  </small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                {PRESET_INSTRUCTIONS.map((pref) => {
                  const isActive = selectedInstructions.includes(pref.label);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => toggleInstruction(pref.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 11px',
                        borderRadius: '10px',
                        border: isActive ? '1.5px solid #059669' : '1px solid #e2e8f0',
                        background: isActive ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{pref.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: '11.5px', color: isActive ? '#047857' : '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pref.label}
                        </b>
                        <span style={{ fontSize: '9.5px', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pref.sub}
                        </span>
                      </div>
                      {isActive && (
                        <Check size={13} color="#059669" strokeWidth={3} style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="✍️ Any specific instructions? (e.g. Landmark, second floor, leave on table)"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Step 4: Items in Order (Direct compact list, no hide/view toggle) */}
            <div className="checkout-card-v2" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <ShoppingBag size={15} />
                  </div>
                  <div>
                    <b style={{ fontSize: '13.5px', color: '#0f172a' }}>
                      Items in Order ({cartItems.length})
                    </b>
                  </div>
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                  {cartItems.reduce((s, i) => s + i.qty, 0)} units · {money(subtotal)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '6px 0',
                      borderBottom: '1px solid #f8fafc',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', background: '#f8fafc', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b style={{ display: 'block', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}>
                          {item.name}
                        </b>
                        <small style={{ color: '#64748b', fontSize: '10.5px' }}>
                          {item.unit || 'Pack'} · Qty: {item.qty} × {money(item.price)}
                        </small>
                      </div>
                    </div>
                    <b style={{ color: '#0f172a', flexShrink: 0, fontSize: '12px' }}>
                      {money(item.price * item.qty)}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 5: Payment Option (Compact Single-Row Card) */}
            <div
              className="checkout-card-v2"
              style={{
                padding: '12px 14px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
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
                    <Banknote size={17} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b style={{ fontSize: '13px', color: '#0f172a' }}>Cash on Delivery (COD)</b>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: rules?.allowCod === false ? '#fee2e2' : '#dcfce7',
                          color: rules?.allowCod === false ? '#b91c1c' : '#15803d',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}
                      >
                        {rules?.allowCod === false ? 'Unavailable' : 'Available'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Pay via cash or UPI scanner upon doorstep delivery
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#059669',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              {rules?.allowCod === false && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '12px' }}>
                  ⚠️ Cash on Delivery is currently disabled for {selectedAddress?.area || 'selected delivery zone'}.
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Coupons & Bill Details */}
          <aside id="checkout-bill-summary">
            {/* Promo / Coupon Card */}
            <div className="checkout-card-v2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Tag size={16} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Coupon & Offers
                </h4>
              </div>

              {coupon ? (
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
                      <span>{coupon.code} Applied</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '1px' }}>
                      Saving {money(coupon.discount)} on your bill
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
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
                      disabled={Boolean(applying) || !couponInput.trim()}
                      onClick={() => applyCouponCode()}
                      style={{
                        padding: '0 16px',
                        borderRadius: '10px',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: applying || !couponInput.trim() ? 'not-allowed' : 'pointer',
                        opacity: applying || !couponInput.trim() ? 0.6 : 1
                      }}
                    >
                      {applying ? 'Applying…' : 'APPLY'}
                    </button>
                  </div>

                  {/* Available coupon chips */}
                  {coupons.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {coupons.slice(0, 3).map((c) => (
                        <button
                          key={c.id || c.code}
                          type="button"
                          onClick={() => applyCouponCode(c.code)}
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
            <div className="checkout-card-v2">
              <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Bill Details
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {mrpTotal > subtotal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Items Total (MRP)</span>
                    <del>{money(mrpTotal)}</del>
                  </div>
                )}

                {productSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Product Discount</span>
                    <span>-{money(productSavings)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <span>Item Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Delivery Partner Fee</span>
                    {rules?.freeDeliveryThreshold > 0 && (
                      <small style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Free on orders above {money(rules.freeDeliveryThreshold)}
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

                {coupon?.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                    <span>Coupon Savings ({coupon.code})</span>
                    <span>-{money(coupon.discount)}</span>
                  </div>
                )}

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

              {/* Quality & Safety Assurance */}
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

              {/* Desktop Place Order Button */}
              <div style={{ marginTop: '16px' }} className="desktop-only-action">
                <Button
                  className="wide"
                  disabled={
                    placing ||
                    isEmergencyActive ||
                    (deliveryType === 'INSTANT' && !allowImmediate) ||
                    (deliveryType === 'SCHEDULED' && !allowScheduled) ||
                    rules?.allowCod === false ||
                    minimumRemaining > 0 ||
                    (deliveryType === 'SCHEDULED' && holidayDates.includes(selectedDate?.id))
                  }
                  onClick={placeOrder}
                  style={{
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    borderRadius: '12px',
                    background: minimumRemaining > 0 ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: minimumRemaining > 0 ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  {placing ? (
                    'Placing Order…'
                  ) : isEmergencyActive ? (
                    'Orders Paused'
                  ) : deliveryType === 'INSTANT' && !allowImmediate ? (
                    'Store Closed (Schedule Only)'
                  ) : rules?.allowCod === false ? (
                    'COD Unavailable'
                  ) : minimumRemaining > 0 ? (
                    `Add ${money(minimumRemaining)} more`
                  ) : (
                    <span>Place Order · Pay {money(total)} →</span>
                  )}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Place Order Bar */}
      <div className="mobile-checkout-sticky-footer">
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
            Pay on Delivery (COD) · View Bill ▲
          </button>
        </div>

        <button
          type="button"
          disabled={
            placing ||
            isEmergencyActive ||
            (deliveryType === 'INSTANT' && !allowImmediate) ||
            (deliveryType === 'SCHEDULED' && !allowScheduled) ||
            rules?.allowCod === false ||
            minimumRemaining > 0 ||
            (deliveryType === 'SCHEDULED' && holidayDates.includes(selectedDate?.id))
          }
          onClick={placeOrder}
          style={{
            height: '44px',
            padding: '0 20px',
            borderRadius: '12px',
            background: minimumRemaining > 0 ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            cursor: minimumRemaining > 0 || placing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: minimumRemaining > 0 ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.35)',
            flexShrink: 0
          }}
        >
          {placing ? (
            'Placing…'
          ) : minimumRemaining > 0 ? (
            `Add ${money(minimumRemaining)}`
          ) : (
            <>
              <span>Place Order</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>

      {/* Address Form Modal */}
      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        title="Add Delivery Address"
        size="location-modal"
      >
        <div className="modal-body">
          <AddressForm onCancel={() => setAddressModal(false)} onSave={saveAddress} />
        </div>
      </Modal>
    </>
  );
}

export default CheckoutPage;
